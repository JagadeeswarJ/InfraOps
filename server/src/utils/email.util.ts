import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.config.js';
import TemplateLoader from './template.util.js';

let transporter: Transporter;

/**
 * Create Gmail transporter
 */
function createTransporter(): Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_APP_PASSWORD
            }
        });
    }
    return transporter;
}

/**
 * Send email with template
 */
export async function sendEmail(to: string, subject: string, template: string, data: any): Promise<void> {
    try {
        const transporterInstance = createTransporter();
        const html = TemplateLoader.loadAndRender(template, data);

        const mailOptions = {
            from: env.EMAIL_FROM || env.EMAIL_USER,
            to,
            subject,
            html,
        };

        const info = await transporterInstance.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}

/**
 * Generate 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, name: string, otp: string): Promise<void> {
    await sendEmail(email, 'Bitnap - Email Verification Code', 'otp-verification', {
        name: name || 'User',
        otp
    });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, userData: {
    name: string;
    email: string;
    role: string;
    communityName?: string;
    expertise?: string;
}): Promise<void> {
    await sendEmail(email, 'Welcome to Bitnap - Your Account is Ready!', 'welcome', {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        communityName: userData.communityName || 'Not assigned',
        expertise: userData.expertise || 'Not specified',
        dashboardUrl: '#'
    });
}

/**
 * Send alert email
 */
export async function sendAlertEmail(email: string, alertData: {
    name: string;
    alertType: string;
    icon: string;
    title: string;
    alertTitle: string;
    message: string;
    details?: string;
    actionUrl?: string;
    actionText?: string;
}): Promise<void> {
    await sendEmail(email, `${alertData.alertType.toUpperCase()}: ${alertData.title} - Bitnap`, 'alert-notification', {
        name: alertData.name,
        alertType: alertData.alertType,
        icon: alertData.icon,
        title: alertData.title,
        alertTitle: alertData.alertTitle,
        message: alertData.message,
        details: alertData.details || '',
        actionUrl: alertData.actionUrl || '#',
        actionText: alertData.actionText || 'View Details',
        timestamp: new Date().toLocaleString()
    });
}

/**
 * Send ticket update email
 */
export async function sendTicketUpdateEmail(email: string, ticketData: {
    name: string;
    ticketId: string;
    title: string;
    status: string;
    assignedTo?: string;
}): Promise<void> {
    const alertType = ticketData.status === 'resolved' ? 'success' : 
                     ticketData.status === 'in_progress' ? 'info' : 'warning';
    
    const icon = ticketData.status === 'resolved' ? '✅' : 
                ticketData.status === 'in_progress' ? '🔧' : '📋';

    let details = `<div><strong>Ticket ID:</strong> ${ticketData.ticketId}</div>`;
    details += `<div><strong>Title:</strong> ${ticketData.title}</div>`;
    details += `<div><strong>Status:</strong> ${ticketData.status}</div>`;
    if (ticketData.assignedTo) {
        details += `<div><strong>Assigned To:</strong> ${ticketData.assignedTo}</div>`;
    }

    await sendAlertEmail(email, {
        name: ticketData.name,
        alertType,
        icon,
        title: 'Ticket Status Update',
        alertTitle: `Ticket #${ticketData.ticketId} - ${ticketData.status.toUpperCase()}`,
        message: `Your ticket "${ticketData.title}" has been updated.`,
        details
    });
}

export default {
    sendEmail,
    generateOTP,
    sendOTPEmail,
    sendWelcomeEmail,
    sendAlertEmail,
    sendTicketUpdateEmail
};