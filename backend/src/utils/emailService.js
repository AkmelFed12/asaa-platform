/**
 * Email Service - ASAA Platform
 * Gère l'envoi des notifications par email
 */

const nodemailer = require('nodemailer');

// Configuration pour production (utiliser Gmail, SendGrid, ou autre service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'asaa.notifications@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your_app_password_here'
  }
});

/**
 * Envoyer email de notification de quiz
 */
const sendQuizNotification = async (userEmail, userName, quizStats) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ASAA Platform <notifications@asaa.com>',
      to: userEmail,
      subject: '🎓 ASAA Quiz Quotidien - Résultats du jour',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 2em;">📚 ASAA Quiz</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Vos résultats d'aujourd'hui</p>
          </div>

          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Bienvenue, ${userName}!</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #667eea; margin-top: 0;">📊 Résultats</h3>
              <p><strong>Score:</strong> ${quizStats.score}/${quizStats.total}</p>
              <p><strong>Pourcentage:</strong> ${quizStats.percentage}%</p>
              <p><strong>Niveau:</strong> <span style="padding: 5px 10px; border-radius: 5px; background: ${getLevelColor(quizStats.level)};">${quizStats.level}</span></p>
              <p><strong>Rang:</strong> #${quizStats.rank}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin-top: 0;">💡 Prochaine étape</h3>
              <p>Continuez vos efforts! Le prochain quiz aura lieu demain à 20h00.</p>
              <p>Visitez la plateforme pour voir le classement complet et améliorer votre rang.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL}/quiz" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Voir le Classement
              </a>
            </div>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.85em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>© 2026 LMO CORP - La formation est notre priorité</p>
            <p>ASAA Platform v2.0</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de quiz envoyé à ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email quiz: ${error.message}`);
    return false;
  }
};

/**
 * Envoyer email de création d'utilisateur
 */
const sendWelcomeEmail = async (userEmail, userName, tempPassword) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ASAA Platform <notifications@asaa.com>',
      to: userEmail,
      subject: '👋 Bienvenue sur ASAA Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 2em;">🎓 ASAA Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Bienvenue à bord!</p>
          </div>

          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Bonjour ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Votre compte a été créé avec succès. Vous pouvez maintenant accéder à la plateforme ASAA.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">🔑 Identifiants</h3>
              <p><strong>Email:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${userEmail}</code></p>
              <p><strong>Mot de passe temporaire:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
              <p style="color: #e74c3c; font-weight: 600;">⚠️ Veuillez changer votre mot de passe à la première connexion.</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin-top: 0;">✨ Qu'y a-t-il de nouveau?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>📚 Participez au quiz quotidien (20 questions)</li>
                <li>📅 Explorez les événements de la communauté</li>
                <li>🏛️ Découvrez notre gouvernance</li>
                <li>🏆 Comparez-vous au leaderboard</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Se Connecter
              </a>
            </div>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.85em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>© 2026 LMO CORP - La formation est notre priorité</p>
            <p>ASAA Platform v2.0</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email bienvenue: ${error.message}`);
    return false;
  }
};

/**
 * Envoyer email de notification d'événement
 */
const sendEventNotification = async (userEmail, userName, eventData) => {
  try {
    const eventDate = new Date(eventData.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ASAA Platform <notifications@asaa.com>',
      to: userEmail,
      subject: `📅 Nouvel événement ASAA: ${eventData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 2em;">📅 Nouvel Événement</h1>
          </div>

          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">${eventData.title}</h2>
            
            ${eventData.image ? `<img src="${eventData.image}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 20px 0;" alt="${eventData.title}">` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="margin: 5px 0;"><strong>📍 Lieu:</strong> ${eventData.location}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Description</h3>
              <p style="color: #666; line-height: 1.6;">${eventData.description}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL}/events" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Voir l'Événement
              </a>
            </div>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.85em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>© 2026 LMO CORP - La formation est notre priorité</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email d'événement envoyé à ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email événement: ${error.message}`);
    return false;
  }
};

/**
 * Envoyer email de rappel d'evenement (J-1)
 */
const sendEventReminder = async (userEmail, userName, eventData) => {
  try {
    const eventDate = new Date(eventData.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ASAA Platform <notifications@asaa.com>',
      to: userEmail,
      subject: `⏰ Rappel evenement ASAA: ${eventData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 2em;">⏰ Rappel d'Evenement</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Dans moins de 24 heures</p>
          </div>

          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">${eventData.title}</h2>

            ${eventData.image ? `<img src="${eventData.image}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 20px 0;" alt="${eventData.title}">` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="margin: 5px 0;"><strong>📍 Lieu:</strong> ${eventData.location}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Description</h3>
              <p style="color: #666; line-height: 1.6;">${eventData.description}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL}/events" style="display: inline-block; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Voir l'Evenement
              </a>
            </div>
          </div>

          <div style="text-align: center; color: #999; font-size: 0.85em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>© 2026 LMO CORP - La formation est notre priorité</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de rappel envoyé à ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email rappel: ${error.message}`);
    return false;
  }
};

/**
 * Helper: Obtenir la couleur par niveau
 */
function getLevelColor(level) {
  const colors = {
    'Débutant': '#d4edda',
    'Intermédiaire': '#fff3cd',
    'Avancé': '#cfe4ff',
    'Expert': '#f8d7ff'
  };
  return colors[level] || '#d4edda';
}

module.exports = {
  sendQuizNotification,
  sendWelcomeEmail,
  sendEventNotification,
  sendEventReminder
};
