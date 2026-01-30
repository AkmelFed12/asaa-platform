import React from 'react';

function AboutSection({ onBack }) {
  return (
    <section className="status-section">
      <h2>ASAA - Association des Serviteurs d'Allah Azawajal</h2>
      <p><strong>Valeurs fondamentales :</strong> Respect, Tolerance, Pardon.</p>
      <p>
        L'ASAA est une organisation religieuse, sociale et educative. Elle renforce la foi, la fraternite et la
        solidarite au sein de la communaute, en promouvant un Islam authentique, responsable et apaise.
      </p>
      <p>
        Notre approche place l'etre humain au coeur de l'action : apprendre, servir et grandir ensemble, avec
        bienveillance et exigence.
      </p>
      <h3>Notre mission</h3>
      <ul>
        <li>Consolider la cohesion fraternelle entre les membres</li>
        <li>Encourager l'apprentissage et la transmission des enseignements islamiques</li>
        <li>Accompagner la jeunesse dans l'education morale et spirituelle</li>
        <li>Agir pour le bien-etre social par des initiatives solidaires</li>
      </ul>
      {onBack && (
        <button type="button" className="home-action-btn" onClick={onBack}>
          Retour a l'accueil
        </button>
      )}
    </section>
  );
}

export default AboutSection;
