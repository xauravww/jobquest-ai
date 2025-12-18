'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Table, Tag, Modal, Form, Space, Statistic } from 'antd';
import { SearchOutlined, LoginOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
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
        if (!tokens) return;
        try {
            const res = await fetch('/api/naukri/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, tokens, answers: {} }), // Initial apply without answers
            });
            const data = await res.json();

            if (data.jobs && data.jobs[0].status === 200) {
                message.success('Applied successfully!');
                // Update local job status
                setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'applied' } : j));
            } else if (data.jobs && data.jobs[0].questionnaire) {
                // Show questionnaire modal
                setCurrentQuestionnaire(data.jobs[0].questionnaire);
                setCurrentJobId(jobId);
                setQuestionnaireModalVisible(true);

                // Try to get AI answers
                try {
                    const aiRes = await fetch('/api/naukri/ai-answers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionnaire: data.jobs[0].questionnaire }),
                    });
                    const aiData = await aiRes.json();
                    if (aiData.success) {
                        setAiAnswers(aiData.answers);
                    }
                } catch (aiError) {
                    console.error('AI answer generation failed:', aiError);
                }
            } else {
                message.error('Application failed');
            }
        } catch (error) {
            message.error('Apply error');
        }
    };

    const handleQuestionnaireSubmit = async () => {
        if (!tokens || !currentJobId) return;

        try {
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

            if (data.jobs && data.jobs[0].status === 200) {
                message.success('Applied successfully with answers!');
                setJobs(prev => prev.map(j => j.jobId === currentJobId ? { ...j, status: 'applied' } : j));
                setQuestionnaireModalVisible(false);
                setCurrentQuestionnaire([]);
                setCurrentJobId('');
                setAiAnswers({});
                setManualAnswers({});
            } else {
                message.error('Application failed');
            }
        } catch (error) {
            message.error('Apply error');
        }
    };

    const handleUseAiAnswers = () => {
        setManualAnswers(aiAnswers);
    };

    const handleBatchApply = async () => {
        if (!tokens) return;

        const unappliedJobs = jobs.filter(j => j.status !== 'applied');
        if (unappliedJobs.length === 0) {
            message.info('No unapplied jobs to process');
            return;
        }

        message.info(`Starting batch application for ${unappliedJobs.length} jobs...`);

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
            title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
                <Tag color={status === 'applied' ? 'green' : 'blue'}>{status.toUpperCase()}</Tag>
            )
        },
        {
            title: 'Action', key: 'action', render: (_: any, record: any) => (
                <Button
                    size="small"
                    type="primary"
                    onClick={() => handleApply(record.jobId)}
                    disabled={record.status === 'applied'}
                >
                    Apply
                </Button>
            )
        },
    ];

    return (
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
                        <Statistic title="Applications Sent" value={jobs.filter(j => j.status === 'applied').length} valueStyle={{ color: '#3f8600' }} />
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
        </div>
    );
}
