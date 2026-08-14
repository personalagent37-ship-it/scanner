const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'codingpython57@gmail.com',
    pass: 'pngm pgrb dyzi izzl'
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("Error checking connection:", error);
  } else {
    console.log("Server is ready to take our messages");
    
    const mailOptions = {
      from: 'codingpython57@gmail.com',
      to: 'codingpython57@gmail.com',
      subject: 'Test Email',
      text: 'If you see this, Nodemailer is working!'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent successfully: " + info.response);
        }
    });
  }
});
