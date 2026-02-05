import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
    try {
        const { to, subject, text, html } = await req.json()

        // Create a transporter using SMTP settings
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'PetroGoals'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to,
            subject,
            text,
            html,
        })

        console.log('Message sent: %s', info.messageId)

        return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (error: any) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send email' },
            { status: 500 }
        )
    }
}
