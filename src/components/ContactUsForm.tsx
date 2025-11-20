"use client";

import React, { useState } from "react";

export default function ContactUsForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just simulate submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-bg-light rounded-xl shadow-lg text-center text-success">
        Thank you for contacting us! We will get back to you soon.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-8 bg-bg-light rounded-xl shadow-lg"
    >
      <h2 className="text-3xl font-semibold mb-4 text-text text-center">Get in Touch</h2>
      <p className="text-text-muted mb-8 text-center">
        Have questions or want to learn more? We&apos;d love to hear from you and help you get started!
      </p>
      <div className="mb-6">
        <label htmlFor="name" className="block mb-2 text-text-muted font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-md border border-border bg-bg text-text focus:border-primary focus:ring-primary focus:outline-none transition"
          placeholder="Your Name"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="email" className="block mb-2 text-text-muted font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-md border border-border bg-bg text-text focus:border-primary focus:ring-primary focus:outline-none transition"
          placeholder="email@example.com"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="phone" className="block mb-2 text-text-muted font-medium">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-md border border-border bg-bg text-text focus:border-primary focus:ring-primary focus:outline-none transition"
          placeholder="+1 (123) 456-7890"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="message" className="block mb-2 text-text-muted font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 rounded-md border border-border bg-bg text-text focus:border-primary focus:ring-primary focus:outline-none transition"
          placeholder="Your Message"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-md hover:bg-highlight transition"
      >
        Send Message
      </button>
    </form>
  );
}
