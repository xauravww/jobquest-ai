'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Table, Tag, Modal, Form, Space, Statistic, Alert } from 'antd';
import { SearchOutlined, LoginOutlined, RobotOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import AppLayout from '@/components/AppLayout';
// Removed unused motion import

interface NaukriTokens {
    authorization: string;
    cookies: string;
}

export default function NaukriAutomationPage() {
    const [tokens, setTokens] = useState<NaukriTokens | null>(null);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [searchCriteria, setSearchCriteria] = useState({
        keyword: '',
        location: '',
        experience: 0,
        salary: ''
    });
    const [questionnaireModalVisible, setQuestionnaireModalVisible] = useState(false);
    const [currentQuestionnaire, setCurrentQuestionnaire] = useState<any[]>([]);
    const [currentJobId, setCurrentJobId] = useState<string>('');
    const [aiAnswers, setAiAnswers] = useState<any>({});
    const [manualAnswers, setManualAnswers] = useState<any>({});
    const [externalApplyWarningVisible, setExternalApplyWarningVisible] = useState(false);
    const [pendingExternalJob, setPendingExternalJob] = useState<any>(null);
    const [applicationLogModalVisible, setApplicationLogModalVisible] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);

    // Load tokens from localStorage on mount
    useEffect(() => {
        const storedTokens = localStorage.getItem('naukri_tokens');
        if (storedTokens) {
            setTokens(JSON.parse(storedTokens));
        }
    }, []);

    const handleLogin = async (values: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/naukri/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
                setTokens(data.tokens);
                localStorage.setItem('naukri_tokens', JSON.stringify(data.tokens));
                message.success('Logged in to Naukri successfully');
                setIsLoginModalVisible(false);
            } else {
                message.error(data.error || 'Login failed');
            }
        } catch (error) {
            message.error('Login error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!tokens) {
            message.warning('Please login first');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/naukri/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criteria: searchCriteria, tokens }),
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
                message.success(`Found and saved ${data.count} jobs`);
            } else {
                message.error(data.error || 'Search failed');
            }
        } catch (error) {
            message.error('Search error');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: string) => {
        // Find the job to check if it's external
        const job = jobs.find(j => j.jobId === jobId);
        if (!job) return;

        // Initialize application logs for this job
        const applicationLogs = job.applicationLogs || [];

        const addLog = (type: 'info' | 'success' | 'warning' | 'error', action: string, message: string, details?: any) => {
            applicationLogs.push({
                type,
                action,
                message,
                details,
                timestamp: new Date().toISOString()
            });
        };

        // Handle external applications
        if (job.isExternalApplication) {
            addLog('info', 'External Application Initiated', `Opening external application link for job: ${job.title} at ${job.company}`, {
                externalUrl: job.externalApplyUrl || job.url
            });

            message.info('Opening external application link. Please update status after applying.');

            // Show modal to confirm external application
            Modal.confirm({
                title: 'External Application',
                content: 'This job requires application on the company\'s website. Would you like to mark it as applied after you complete the external application?',
                okText: 'Mark as Applied Later',
                cancelText: 'Just Open Link',
                onOk: () => {
                    // Mark as "external_pending" to indicate user intends to apply externally
                    setJobs(prev => prev.map(j => j.jobId === jobId ? {
                        ...j,
                        status: 'external_pending',
                        applicationLogs: [...applicationLogs, {
                            type: 'info',
                            action: 'External Application Marked Pending',
                            message: 'User chose to mark as applied later after completing external application',
                            timestamp: new Date().toISOString()
                        }]
                    } : j));
                },
                onCancel: () => {
                    // Just open the link without changing status
                    addLog('info', 'External Link Opened', 'User opened external application link without status tracking');
                    setJobs(prev => prev.map(j => j.jobId === jobId ? {
                        ...j,
                        applicationLogs
                    } : j));
                    window.open(job.externalApplyUrl || job.url, '_blank');
                }
            });

            // Open external link
            window.open(job.externalApplyUrl || job.url, '_blank');
            return;
        }

        if (!tokens) {
            addLog('error', 'Application Failed', 'No authentication tokens available');
            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
            return;
        }

        try {
            addLog('info', 'Application Initiated', `Starting application process for job: ${job.title} at ${job.company}`, {
                jobId,
                company: job.company,
                title: job.title
            });

            // Try CLI-style approach: make apply call without answers first (like CLI does)
            const res = await fetch('/api/naukri/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, tokens, cliStyle: true }), // CLI-style: no answers parameter
            });
            const data = await res.json();

            addLog('info', 'API Response Received', `Received response from Naukri API`, {
                status: res.status,
                hasJobs: !!data.jobs,
                jobCount: data.jobs?.length || 0
            });

            // Handle token expiration
            if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
                addLog('error', 'Authentication Failed', 'Session token expired - user needs to re-login', {
                    errorCode: data.code,
                    status: res.status
                });
                message.error('Session expired. Please login again.');
                // Clear expired tokens
                localStorage.removeItem('naukri_tokens');
                setTokens(null);
                // Show login modal
                setIsLoginModalVisible(true);
                setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
                return;
            }

            // Handle external application requirement
            if (res.status === 406 && data.code === 'EXTERNAL_REQUIRED') {
                addLog('warning', 'External Application Required', 'Job detected as requiring external application during API call', {
                    errorCode: data.code,
                    externalUrl: data.externalApplyUrl
                });
                message.warning('This job requires external application. Opening external link...');
                // Mark as external and open link
                setJobs(prev => prev.map(j => j.jobId === jobId ? {
                    ...j,
                    status: 'external',
                    isExternalApplication: true,
                    externalApplyUrl: data.externalApplyUrl || j.url,
                    applicationLogs
                } : j));
                // Open external link
                window.open(data.externalApplyUrl || `https://www.naukri.com/job-listings-${jobId}`, '_blank');
                return;
            }

            // Check for questionnaire in CLI-style response (direct questionnaire data)
            const hasQuestionnaireInResponse = data.jobs && data.jobs[0] && data.jobs[0].questionnaire;

            // Check if job has validation errors indicating questionnaire is needed (fallback)
            const hasQuestionnaireError = data.jobs && data.jobs[0] &&
                data.jobs[0].validationError &&
                data.jobs[0].validationError.some((error: any) =>
                    error.customErrorCode === 286 || error.message?.includes('questionnaire')
                );

            if (data.jobs && data.jobs[0].status === 200) {
                addLog('success', 'Application Successful', 'Job application completed successfully without questionnaire', {
                    applicationStatus: data.jobs[0].status,
                    success: true
                });
                message.success('Applied successfully!');
                // Update local job status
                setJobs(prev => prev.map(j => j.jobId === jobId ? {
                    ...j,
                    status: 'applied',
                    applicationLogs
                } : j));
            } else if (hasQuestionnaireInResponse) {
                // CLI-style: questionnaire comes directly in response
                addLog('info', 'Questionnaire Available (CLI-style)', `Job requires questionnaire with ${data.jobs[0].questionnaire.length} questions`, {
                    questionnaireLength: data.jobs[0].questionnaire.length,
                    questions: data.jobs[0].questionnaire.map((q: any) => q.questionName)
                });

                // Show questionnaire modal
                setCurrentQuestionnaire(data.jobs[0].questionnaire);
                setCurrentJobId(jobId);
                setQuestionnaireModalVisible(true);

                // Try to get AI answers
                try {
                    addLog('info', 'AI Answer Generation', 'Attempting to generate AI answers for questionnaire');
                    const aiRes = await fetch('/api/naukri/ai-answers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionnaire: data.jobs[0].questionnaire }),
                    });
                    const aiData = await aiRes.json();
                    if (aiData.success) {
                        addLog('success', 'AI Answers Generated', `Successfully generated ${Object.keys(aiData.answers).length} AI answers`, {
                            answerCount: Object.keys(aiData.answers).length
                        });
                        setAiAnswers(aiData.answers);
                    } else {
                        addLog('warning', 'AI Answer Generation Failed', 'AI service returned unsuccessful response');
                    }
                } catch (aiError) {
                    addLog('warning', 'AI Answer Generation Error', 'Failed to generate AI answers', aiError);
                    console.error('AI answer generation failed:', aiError);
                }

                setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
            } else if (hasQuestionnaireError) {
                addLog('info', 'Questionnaire Required (Validation Error)', 'API indicated questionnaire is required via validation error - making second attempt', {
                    validationErrors: data.jobs[0].validationError,
                    jobStatus: data.jobs[0].status
                });

                    // Try to get questionnaire using CLI-style call
                    try {
                        addLog('info', 'Fetching Questionnaire (CLI-style)', 'Making CLI-style apply call to get questionnaire data');

                        const questionnaireRes = await fetch('/api/naukri/questionnaire', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jobId,
                                tokens,
                                answers: {}
                            }),
                        });

                        const questionnaireData = await questionnaireRes.json();

                        if (questionnaireData.jobs && questionnaireData.jobs[0] && questionnaireData.jobs[0].questionnaire) {
                            addLog('success', 'Questionnaire Retrieved (CLI-style)', `Successfully retrieved questionnaire with ${questionnaireData.jobs[0].questionnaire.length} questions`, {
                                questionnaireLength: questionnaireData.jobs[0].questionnaire.length,
                                questions: questionnaireData.jobs[0].questionnaire.map((q: any) => q.questionName),
                                method: 'cli_style'
                            });

                            // Show questionnaire modal
                            setCurrentQuestionnaire(questionnaireData.jobs[0].questionnaire);
                            setCurrentJobId(jobId);
                            setQuestionnaireModalVisible(true);

                            // Try to get AI answers
                            try {
                                addLog('info', 'AI Answer Generation', 'Attempting to generate AI answers for questionnaire');
                                const aiRes = await fetch('/api/naukri/ai-answers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ questionnaire: questionnaireData.jobs[0].questionnaire }),
                                });
                                const aiData = await aiRes.json();
                                if (aiData.success) {
                                    addLog('success', 'AI Answers Generated', `Successfully generated ${Object.keys(aiData.answers).length} AI answers`, {
                                        answerCount: Object.keys(aiData.answers).length
                                    });
                                    setAiAnswers(aiData.answers);
                                } else {
                                    addLog('warning', 'AI Answer Generation Failed', 'AI service returned unsuccessful response');
                                }
                            } catch (aiError) {
                                addLog('warning', 'AI Answer Generation Error', 'Failed to generate AI answers', aiError);
                                console.error('AI answer generation failed:', aiError);
                            }

                            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
                        } else if (questionnaireData.questionnaire) {
                            // Direct questionnaire in response
                            addLog('success', 'Questionnaire Retrieved (Direct)', `Successfully retrieved questionnaire with ${questionnaireData.questionnaire.length} questions`, {
                                questionnaireLength: questionnaireData.questionnaire.length,
                                questions: questionnaireData.questionnaire.map((q: any) => q.questionName),
                                method: 'direct'
                            });

                            // Show questionnaire modal
                            setCurrentQuestionnaire(questionnaireData.questionnaire);
                            setCurrentJobId(jobId);
                            setQuestionnaireModalVisible(true);

                            // Try to get AI answers
                            try {
                                addLog('info', 'AI Answer Generation', 'Attempting to generate AI answers for questionnaire');
                                const aiRes = await fetch('/api/naukri/ai-answers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ questionnaire: questionnaireData.questionnaire }),
                                });
                                const aiData = await aiRes.json();
                                if (aiData.success) {
                                    addLog('success', 'AI Answers Generated', `Successfully generated ${Object.keys(aiData.answers).length} AI answers`, {
                                        answerCount: Object.keys(aiData.answers).length
                                    });
                                    setAiAnswers(aiData.answers);
                                } else {
                                    addLog('warning', 'AI Answer Generation Failed', 'AI service returned unsuccessful response');
                                }
                            } catch (aiError) {
                                addLog('warning', 'AI Answer Generation Error', 'Failed to generate AI answers', aiError);
                                console.error('AI answer generation failed:', aiError);
                            }

                            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
                        } else {
                            addLog('error', 'Questionnaire Not Available', 'CLI-style questionnaire call did not return questionnaire', {
                                questionnaireResponse: questionnaireData
                            });
                            message.error('Unable to retrieve questionnaire. Please try applying manually on Naukri.');
                            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
                        }
                    } catch (questionnaireError) {
                        addLog('error', 'Questionnaire Fetch Failed', 'Failed to fetch questionnaire using CLI-style call', questionnaireError);
                        message.error('Failed to load questionnaire. Please try applying manually.');
                        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
                    }
            } else if (data.jobs && data.jobs[0].questionnaire) {
                // Fallback: questionnaire provided directly in response
                addLog('info', 'Questionnaire Required (Direct)', `Job requires questionnaire with ${data.jobs[0].questionnaire.length} questions`, {
                    questionnaireLength: data.jobs[0].questionnaire.length,
                    questions: data.jobs[0].questionnaire.map((q: any) => q.questionName)
                });

                // Show questionnaire modal
                setCurrentQuestionnaire(data.jobs[0].questionnaire);
                setCurrentJobId(jobId);
                setQuestionnaireModalVisible(true);

                // Try to get AI answers
                try {
                    addLog('info', 'AI Answer Generation', 'Attempting to generate AI answers for questionnaire');
                    const aiRes = await fetch('/api/naukri/ai-answers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionnaire: data.jobs[0].questionnaire }),
                    });
                    const aiData = await aiRes.json();
                    if (aiData.success) {
                        addLog('success', 'AI Answers Generated', `Successfully generated ${Object.keys(aiData.answers).length} AI answers`, {
                            answerCount: Object.keys(aiData.answers).length
                        });
                        setAiAnswers(aiData.answers);
                    } else {
                        addLog('warning', 'AI Answer Generation Failed', 'AI service returned unsuccessful response');
                    }
                } catch (aiError) {
                    addLog('warning', 'AI Answer Generation Error', 'Failed to generate AI answers', aiError);
                    console.error('AI answer generation failed:', aiError);
                }

                setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
            } else {
                addLog('error', 'Application Failed', 'Application failed with unknown error', {
                    responseData: data,
                    status: res.status,
                    validationErrors: data.jobs?.[0]?.validationError
                });
                message.error('Application failed');
                setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
            }
        } catch (error) {
            addLog('error', 'Application Error', 'Unexpected error during application process', error);
            message.error('Apply error');
            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, applicationLogs } : j));
        }
    };

    const handleQuestionnaireSubmit = async () => {
        if (!tokens || !currentJobId) return;

        const job = jobs.find(j => j.jobId === currentJobId);
        const applicationLogs = job?.applicationLogs || [];

        const addLog = (type: 'info' | 'success' | 'warning' | 'error', action: string, message: string, details?: any) => {
            applicationLogs.push({
                type,
                action,
                message,
                details,
                timestamp: new Date().toISOString()
            });
        };

        try {
            addLog('info', 'Questionnaire Submission Started', `Submitting questionnaire with ${Object.keys(manualAnswers).length} answers`, {
                answerCount: Object.keys(manualAnswers).length,
                answers: manualAnswers
            });

            const res = await fetch('/api/naukri/questionnaire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: currentJobId,
                    tokens,
                    answers: manualAnswers
                }),
            });
            const data = await res.json();

            addLog('info', 'Questionnaire API Response', `Received response from questionnaire submission`, {
                status: res.status,
                success: data.jobs?.[0]?.status === 200
            });

            // Handle token expiration
            if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
                addLog('error', 'Authentication Failed During Questionnaire', 'Session expired during questionnaire submission');
                message.error('Session expired. Please login again.');
                // Clear expired tokens
                localStorage.removeItem('naukri_tokens');
                setTokens(null);
                // Show login modal
                setIsLoginModalVisible(true);
                setJobs(prev => prev.map(j => j.jobId === currentJobId ? { ...j, applicationLogs } : j));
                return;
            }

            // Handle external application requirement
            if (res.status === 406 && data.code === 'EXTERNAL_REQUIRED') {
                addLog('warning', 'External Application Detected During Questionnaire', 'Job switched to external application during questionnaire submission', {
                    externalUrl: data.externalApplyUrl
                });
                message.warning('This job requires external application. Opening external link...');
                // Mark as external and close questionnaire modal
                setJobs(prev => prev.map(j => j.jobId === currentJobId ? {
                    ...j,
                    status: 'external',
                    isExternalApplication: true,
                    externalApplyUrl: data.externalApplyUrl || j.url,
                    applicationLogs
                } : j));
                setQuestionnaireModalVisible(false);
                setCurrentQuestionnaire([]);
                setCurrentJobId('');
                // Open external link
                window.open(data.externalApplyUrl || `https://www.naukri.com/job-listings-${currentJobId}`, '_blank');
                return;
            }

            if (data.jobs && data.jobs[0].status === 200) {
                addLog('success', 'Questionnaire Application Successful', 'Job application completed successfully with questionnaire answers', {
                    applicationStatus: data.jobs[0].status,
                    questionnaire: currentQuestionnaire?.map((q: any, index: number) => ({
                        question: q.questionName,
                        answer: manualAnswers[q.questionId] || 'No answer provided'
                    }))
                });
                message.success('Applied successfully with answers!');
                setJobs(prev => prev.map(j => j.jobId === currentJobId ? {
                    ...j,
                    status: 'applied',
                    applicationLogs
                } : j));
                setQuestionnaireModalVisible(false);
                setCurrentQuestionnaire([]);
                setCurrentJobId('');
                setAiAnswers({});
                setManualAnswers({});
            } else {
                addLog('error', 'Questionnaire Application Failed', 'Application failed after questionnaire submission', {
                    responseData: data,
                    status: res.status
                });
                message.error('Application failed');
                setJobs(prev => prev.map(j => j.jobId === currentJobId ? { ...j, applicationLogs } : j));
            }
        } catch (error) {
            addLog('error', 'Questionnaire Submission Error', 'Unexpected error during questionnaire submission', error);
            message.error('Apply error');
            setJobs(prev => prev.map(j => j.jobId === currentJobId ? { ...j, applicationLogs } : j));
        }
    };

    const handleUseAiAnswers = () => {
        setManualAnswers(aiAnswers);
    };

    const handleBatchApply = async () => {
        if (!tokens) return;

        const unappliedJobs = jobs.filter(j => j.status !== 'applied' && !j.isExternalApplication);
        const externalJobs = jobs.filter(j => j.isExternalApplication && j.status !== 'external_applied');

        if (unappliedJobs.length === 0) {
            if (externalJobs.length > 0) {
                message.info(`No Naukri jobs to auto-apply. ${externalJobs.length} external applications available.`);
            } else {
                message.info('No unapplied jobs to process');
            }
            return;
        }

        message.info(`Starting batch application for ${unappliedJobs.length} Naukri jobs...`);

        for (const job of unappliedJobs) {
            try {
                await handleApply(job.jobId);
                // Small delay between applications to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to apply to job ${job.jobId}:`, error);
            }
        }

        message.success('Batch application completed');
    };

    const columns = [
        { title: 'Job Title', dataIndex: 'title', key: 'title' },
        { title: 'Company', dataIndex: 'company', key: 'company' },
        { title: 'Location', dataIndex: 'location', key: 'location' },
        {
            title: 'Application URL', key: 'applicationUrl', render: (_: any, record: any) => {
                const url = record.externalApplyUrl || record.url;
                const isExternal = record.isExternalApplication;
                const displayText = isExternal ? '🌐 External Apply' : '🏢 Naukri Apply';

                const handleClick = (e: React.MouseEvent) => {
                    if (isExternal) {
                        e.preventDefault();
                        setPendingExternalJob(record);
                        setExternalApplyWarningVisible(true);
                    }
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a
                            href={isExternal ? '#' : url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: isExternal ? '#fa8c16' : '#1890ff',
                                textDecoration: 'none',
                                fontWeight: '500',
                                cursor: isExternal ? 'pointer' : 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            onClick={handleClick}
                        >
                            {displayText}
                        </a>
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            maxWidth: '200px'
                        }}>
                            {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', render: (status: string, record: any) => {
                let color = 'blue';
                let displayText = status.toUpperCase();
                let tooltip = '';

                if (status === 'applied') {
                    color = 'green';
                    displayText = '✅ API APPLIED';
                    tooltip = 'Successfully applied via Naukri API';
                } else if (status === 'external') {
                    color = 'orange';
                    displayText = '🌐 EXTERNAL ONLY';
                    tooltip = 'Requires application on company website - not tracked by this system';
                } else if (status === 'external_pending') {
                    color = 'gold';
                    displayText = '⏳ EXTERNAL PENDING';
                    tooltip = 'External link opened - application status unknown';
                } else if (status === 'external_applied') {
                    color = 'green';
                    displayText = '✅ EXTERNAL APPLIED';
                    tooltip = 'User marked as applied externally (manual tracking)';
                } else if (status === 'saved') {
                    color = 'blue';
                    displayText = '💾 SAVED';
                    tooltip = 'Job saved for later application';
                }

                return (
                    <Tag color={color} title={tooltip}>
                        {displayText}
                    </Tag>
                );
            }
        },
        {
            title: 'Action', key: 'action', render: (_: any, record: any) => {
                if (record.isExternalApplication) {
                    const isPending = record.status === 'external_pending';
                    const isApplied = record.status === 'external_applied';

                    return (
                        <Space>
                            <Button
                                size="small"
                                type="primary"
                                danger
                                onClick={() => {
                                    setPendingExternalJob(record);
                                    setExternalApplyWarningVisible(true);
                                }}
                                disabled={isApplied}
                            >
                                {isApplied ? '✅ Applied Externally' : '🌐 Apply Externally'}
                            </Button>
                            {isPending && (
                                <Button
                                    size="small"
                                    type="default"
                                    onClick={() => {
                                        setJobs(prev => prev.map(j =>
                                            j.jobId === record.jobId
                                                ? { ...j, status: 'external_applied' }
                                                : j
                                        ));
                                        message.success('Marked as applied externally!');
                                    }}
                                >
                                    ✅ Mark as Applied
                                </Button>
                            )}
                        </Space>
                    );
                }

                // Internal job actions
                return (
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => handleApply(record.jobId)}
                        loading={loading}
                        disabled={!tokens || record.status === 'applied'}
                    >
                        {record.status === 'applied' ? '✅ Applied' : '🏢 Apply via API'}
                    </Button>
                );
            }
        },
    ];

    return (
        <AppLayout showFooter={false}>
            <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Naukri Automation
                </h1>
                <Space>
                    {!tokens ? (
                        <Button type="primary" icon={<LoginOutlined />} onClick={() => setIsLoginModalVisible(true)}>
                            Login to Naukri
                        </Button>
                    ) : (
                        <Tag color="success" icon={<RobotOutlined />}>Connected to Naukri</Tag>
                    )}
                </Space>
            </div>

            {/* Application Type Disclaimer */}
            <Alert
                message="📋 Application Types Explained"
                description={
                    <div>
                        <strong>🏢 API Applied:</strong> Jobs applied automatically via Naukri's system (tracked and verified)<br/>
                        <strong>🌐 External Applied:</strong> Jobs requiring manual application on company websites (not tracked by this system)
                    </div>
                }
                type="info"
                showIcon
                closable
                style={{ marginBottom: '24px' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Search Configuration" className="md:col-span-2 shadow-lg">
                    <Form layout="vertical" className="grid grid-cols-2 gap-4">
                        <Form.Item label="Keywords">
                            <Input
                                placeholder="e.g. React Developer"
                                value={searchCriteria.keyword}
                                onChange={e => setSearchCriteria({ ...searchCriteria, keyword: e.target.value })}
                            />
                        </Form.Item>
                        <Form.Item label="Location">
                            <Input
                                placeholder="e.g. Pune"
                                value={searchCriteria.location}
                                onChange={e => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
                            />
                        </Form.Item>
                        <Form.Item label="Experience (Years)">
                            <Input
                                type="number"
                                placeholder="e.g. 3"
                                value={searchCriteria.experience}
                                onChange={e => setSearchCriteria({ ...searchCriteria, experience: Number(e.target.value) })}
                            />
                        </Form.Item>
                        <Form.Item label="Salary Filter">
                            <Input
                                placeholder="e.g. 6to10"
                                value={searchCriteria.salary}
                                onChange={e => setSearchCriteria({ ...searchCriteria, salary: e.target.value })}
                            />
                        </Form.Item>
                        <div className="col-span-2">
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading} block>
                                Fetch Jobs
                            </Button>
                        </div>
                    </Form>
                </Card>

                <Card title="Stats & Actions" className="shadow-lg">
                    <div className="space-y-4">
                        <Statistic title="Jobs Fetched" value={jobs.length} prefix={<ReloadOutlined />} />
                        <Statistic title="Naukri Applications" value={jobs.filter(j => j.status === 'applied').length} valueStyle={{ color: '#3f8600' }} />
                        <Statistic title="External Applied" value={jobs.filter(j => j.status === 'external_applied').length} valueStyle={{ color: '#52c41a' }} />
                        <Statistic title="External Pending" value={jobs.filter(j => j.status === 'external_pending').length} valueStyle={{ color: '#faad14' }} />
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            onClick={handleBatchApply}
                            disabled={!tokens || jobs.length === 0}
                            block
                        >
                            Batch Apply to All
                        </Button>
                    </div>
                </Card>
            </div>

            <Card title="Job Queue" className="shadow-lg">
                <Table
                    dataSource={jobs}
                    columns={columns}
                    rowKey="jobId"
                    pagination={{ pageSize: 5 }}
                    onRow={(record) => ({
                        onClick: () => {
                            setSelectedJob(record);
                            setApplicationLogModalVisible(true);
                        },
                        style: { cursor: 'pointer' }
                    })}
                />
            </Card>

            <Modal
                title="Login to Naukri"
                open={isLoginModalVisible}
                onCancel={() => setIsLoginModalVisible(false)}
                footer={null}
            >
                <Form onFinish={handleLogin} layout="vertical">
                    <Form.Item name="username" label="Email/Username" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Job Application Questionnaire"
                open={questionnaireModalVisible}
                onCancel={() => setQuestionnaireModalVisible(false)}
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setQuestionnaireModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="ai" type="default" onClick={handleUseAiAnswers} disabled={Object.keys(aiAnswers).length === 0}>
                        Use AI Answers
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleQuestionnaireSubmit}>
                        Submit Application
                    </Button>
                ]}
            >
                <div className="space-y-4">
                    <p className="text-gray-600">This job requires additional information. Please answer the questions below:</p>

                    {currentQuestionnaire.map((question: any, index: number) => (
                        <div key={question.questionId} className="border-b pb-4">
                            <h4 className="font-medium mb-2">{question.questionName}</h4>
                            <p className="text-sm text-gray-500 mb-2">Type: {question.questionType}</p>

                            {question.questionType === 'List Menu' && question.answerOption && (
                                <select
                                    className="w-full p-2 border rounded"
                                    value={manualAnswers[question.questionId] || ''}
                                    onChange={(e) => setManualAnswers({
                                        ...manualAnswers,
                                        [question.questionId]: e.target.value
                                    })}
                                >
                                    <option value="">Select an option</option>
                                    {Object.entries(question.answerOption).map(([key, value]: [string, any]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            )}

                            {question.questionType === 'Check Box' && question.answerOption && (
                                <div className="space-y-2">
                                    {Object.entries(question.answerOption).map(([key, value]: [string, any]) => (
                                        <label key={key} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={(manualAnswers[question.questionId] || []).includes(key)}
                                                onChange={(e) => {
                                                    const current = manualAnswers[question.questionId] || [];
                                                    if (e.target.checked) {
                                                        setManualAnswers({
                                                            ...manualAnswers,
                                                            [question.questionId]: [...current, key]
                                                        });
                                                    } else {
                                                        setManualAnswers({
                                                            ...manualAnswers,
                                                            [question.questionId]: current.filter((k: string) => k !== key)
                                                        });
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            {value}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {question.questionType === 'Text' && (
                                <Input.TextArea
                                    placeholder="Enter your answer"
                                    value={manualAnswers[question.questionId] || ''}
                                    onChange={(e) => setManualAnswers({
                                        ...manualAnswers,
                                        [question.questionId]: e.target.value
                                    })}
                                />
                            )}

                            {aiAnswers[question.questionId] && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                    <strong>AI Suggestion:</strong> {question.questionType === 'Check Box' ?
                                        aiAnswers[question.questionId].join(', ') :
                                        aiAnswers[question.questionId]}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>

            {/* External Apply Warning Modal */}
            <Modal
                title="⚠️ External Job Application Warning"
                open={externalApplyWarningVisible}
                onCancel={() => {
                    setExternalApplyWarningVisible(false);
                    setPendingExternalJob(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setExternalApplyWarningVisible(false);
                        setPendingExternalJob(null);
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="proceed"
                        type="primary"
                        danger
                        onClick={() => {
                            if (pendingExternalJob) {
                                const url = pendingExternalJob.externalApplyUrl || pendingExternalJob.url;
                                window.open(url, '_blank', 'noopener,noreferrer');

                                // Update job status to external_pending
                                setJobs(prev => prev.map(j =>
                                    j.jobId === pendingExternalJob.jobId
                                        ? { ...j, status: 'external_pending' }
                                        : j
                                ));

                                // Optional: Track this action
                                message.warning('Remember: External applications are not tracked by this system!');
                            }
                            setExternalApplyWarningVisible(false);
                            setPendingExternalJob(null);
                        }}
                    >
                        I Understand - Open External Link
                    </Button>
                ]}
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '500', color: '#fa8c16' }}>
                        🚨 Important: External Job Application
                    </div>

                    <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                        <strong>{pendingExternalJob?.title}</strong> at <strong>{pendingExternalJob?.company}</strong>
                        requires application on the company's external website.
                    </div>

                    <div style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '8px', color: '#d46b08' }}>
                            ⚠️ Critical Information:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>This system <strong>cannot track</strong> applications made on external websites</li>
                            <li>You will be redirected to: <code style={{ backgroundColor: '#f6f6f6', padding: '2px 4px', borderRadius: '3px' }}>{pendingExternalJob?.externalApplyUrl || pendingExternalJob?.url}</code></li>
                            <li>Complete your application on the company site</li>
                            <li>This system will mark the job as "EXTERNAL PENDING" but cannot verify if you actually applied</li>
                            <li>Naukri may show "applied" status even though you applied externally</li>
                        </ul>
                    </div>

                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                        <strong>Recommendation:</strong> Keep track of your external applications manually.
                        This tool is designed for Naukri's built-in application system.
                    </div>
                </div>
            </Modal>

            {/* Application Log Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📋 Application Log: {selectedJob?.title}
                        <Tag color={selectedJob?.isExternalApplication ? 'orange' : 'blue'}>
                            {selectedJob?.isExternalApplication ? 'External' : 'API'}
                        </Tag>
                    </div>
                }
                open={applicationLogModalVisible}
                onCancel={() => {
                    setApplicationLogModalVisible(false);
                    setSelectedJob(null);
                }}
                footer={null}
                width={800}
            >
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {selectedJob?.applicationLogs && selectedJob.applicationLogs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {selectedJob.applicationLogs.map((log: any, index: number) => (
                                <div key={index} style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    backgroundColor: log.type === 'error' ? '#fff2f0' :
                                                   log.type === 'success' ? '#f6ffed' :
                                                   log.type === 'warning' ? '#fffbe6' : '#f5f5f5'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px',
                                        fontWeight: '500'
                                    }}>
                                        {log.type === 'error' && '❌'}
                                        {log.type === 'success' && '✅'}
                                        {log.type === 'warning' && '⚠️'}
                                        {log.type === 'info' && 'ℹ️'}
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                                        {log.action}
                                    </div>
                                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                        {log.message}
                                    </div>
                                    {log.details && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px',
                                            backgroundColor: '#fafafa',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace'
                                        }}>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {log.questionnaire && (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                                                📝 Questionnaire Answers:
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {log.questionnaire.map((q: any, qIndex: number) => (
                                                    <div key={qIndex} style={{
                                                        padding: '8px',
                                                        backgroundColor: '#f0f8ff',
                                                        borderRadius: '4px',
                                                        border: '1px solid #b3d9ff'
                                                    }}>
                                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                                            {q.question}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#1890ff' }}>
                                                            Answer: {q.answer || 'No answer provided'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#999',
                            fontSize: '16px'
                        }}>
                            {selectedJob?.status === 'applied' ? (
                                <div>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                    <div>Application completed successfully via Naukri API</div>
                                    <div style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
                                        No detailed logs available for this application
                                    </div>
                                </div>
                            ) : selectedJob?.isExternalApplication ? (
                                <div>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                                    <div>External application - not processed by this system</div>
                                    <div style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
                                        External applications are handled manually on company websites
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                    <div>No application logs available</div>
                                    <div style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
                                        This job hasn't been processed yet
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            </div>
        </AppLayout>
    );
}
