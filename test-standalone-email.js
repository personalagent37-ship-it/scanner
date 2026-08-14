require('dotenv').config({ path: './.env' });
const nodemailer = require('nodemailer');

const GMAIL_USER = (process.env.GMAIL_ADDRESS || 'codingpython57@gmail.com').replace(/['"]/g, '').trim();
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || 'pngm pgrb dyzi izzl').replace(/['"]/g, '').replace(/\s+/g, '');

console.log("======================================");
console.log("Testing SMTP connection for:", GMAIL_USER);
console.log("Password length (no spaces):", GMAIL_PASS.length);
console.log("======================================");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

const mailOptions = {
  from: GMAIL_USER,
  to: GMAIL_USER,
  subject: 'Standalone SMTP Test',
  text: 'If you receive this, your Nodemailer config and App Password are 100% correct!'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("\n❌ SMTP TEST FAILED. Error details:");
    console.error(error);
  } else {
    console.log("\n✅ SMTP TEST SUCCESSFUL! Email sent.");
    console.log("Message ID:", info.messageId);
  }
});
