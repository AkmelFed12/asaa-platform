import React, { useEffect, useMemo, useState } from 'react';
import { donationService } from '../services/api';
import '../styles/Donations.css';

const presetAmounts = [2000, 5000, 10000, 20000];
const currencyOptions = ['XOF', 'USD', 'NGN'];
const purposeOptions = [
  { value: 'Soutien general', label: 'Soutien general' },
  { value: 'Quiz islamique', label: 'Quiz islamique' },
  { value: 'Actions sociales', label: 'Actions sociales' },
  { value: 'Education', label: 'Education' },
  { value: 'Jeunesse', label: 'Jeunesse' }
];

const DONATION_TOKEN_KEY = 'donation_token';

const cleanupCallbackParams = () => {
  const url = new URL(window.location.href);
  ['status', 'tx_ref', 'transaction_id', 'donation', 'token', 'invoice_token', 'paydunya_token'].forEach((key) => {
    url.searchParams.delete(key);
  });
  window.history.replaceState({}, document.title, url.toString());
};

function Donations({ user }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [purpose, setPurpose] = useState(purposeOptions[0].value);
  const [statusMessage, setStatusMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isBusy = submitting || verifying;
  const formattedPreset = useMemo(
    () => presetAmounts.map((value) => ({
      value,
      label: new Intl.NumberFormat('fr-FR').format(value)
    })),
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    setName((prev) => prev || [user.first_name, user.last_name].filter(Boolean).join(' '));
    setEmail((prev) => prev || user.email || '');
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    const transactionId = params.get('transaction_id');
    const tokenParam = params.get('token') || params.get('invoice_token') || params.get('paydunya_token');
    const storedToken = localStorage.getItem(DONATION_TOKEN_KEY);
    const token = tokenParam || storedToken;
    const donationParam = params.get('donation');
    const status = params.get('status') || donationParam;

    if (!txRef && !transactionId && !token && !status) {
      return;
    }

    if (status === 'cancelled') {
      setStatusMessage({
        type: 'error',
        text: 'Paiement annule. Vous pouvez reessayer si besoin.'
      });
      localStorage.removeItem(DONATION_TOKEN_KEY);
      cleanupCallbackParams();
      return;
    }

    if (!txRef && !transactionId && !token) {
      setStatusMessage({
        type: 'error',
        text: 'Informations de paiement manquantes. Merci de nous contacter.'
      });
      localStorage.removeItem(DONATION_TOKEN_KEY);
      cleanupCallbackParams();
      return;
    }

    setVerifying(true);
    setStatusMessage({
      type: 'info',
      text: 'Verification du paiement en cours...'
    });

    const verifyParams = {};
    if (token) {
      verifyParams.token = token;
    }
    if (txRef) {
      verifyParams.tx_ref = txRef;
    }
    if (transactionId) {
      verifyParams.transaction_id = transactionId;
    }

    donationService
      .verify(verifyParams)
      .then((response) => {
        const paymentStatus = response.data?.status;
        if (paymentStatus === 'successful') {
          setStatusMessage({
            type: 'success',
            text: 'Merci pour votre don. Votre contribution a bien ete recue.'
          });
        } else if (paymentStatus === 'pending') {
          setStatusMessage({
            type: 'info',
            text: 'Paiement en attente de confirmation. Merci de patienter.'
          });
        } else if (paymentStatus) {
          setStatusMessage({
            type: 'error',
            text: `Paiement ${paymentStatus}. Contactez-nous si besoin.`
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Impossible de confirmer le statut du paiement.'
          });
        }
      })
      .catch(() => {
        setStatusMessage({
          type: 'error',
          text: 'Verification impossible pour le moment. Merci de reessayer.'
        });
      })
      .finally(() => {
        setVerifying(false);
        localStorage.removeItem(DONATION_TOKEN_KEY);
      });

    cleanupCallbackParams();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage(null);

    const numericAmount = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatusMessage({
        type: 'error',
        text: 'Veuillez saisir un montant valide.'
      });
      return;
    }
    if (!email.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Adresse email requise pour le paiement.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await donationService.initialize({
        amount: numericAmount,
        currency,
        name: name || 'Anonyme',
        email,
        phone,
        note,
        purpose
      });

      const link = response.data?.link;
      const token = response.data?.token;
      if (token) {
        localStorage.setItem(DONATION_TOKEN_KEY, token);
      }
      if (link) {
        window.location.href = link;
        return;
      }

      localStorage.removeItem(DONATION_TOKEN_KEY);
      setStatusMessage({
        type: 'error',
        text: 'Lien de paiement indisponible.'
      });
    } catch (error) {
      localStorage.removeItem(DONATION_TOKEN_KEY);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.error || 'Impossible de lancer le paiement.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donations-container">
      <section className="donation-hero">
        <h2>Soutenir l'ASAA</h2>
        <p>
          Vos dons financent le quiz islamique, les actions sociales et la formation des membres.
        </p>
        <p className="donation-subtle">Paiement securise via PayDunya.</p>
      </section>

      {statusMessage && (
        <div className={`donation-status ${statusMessage.type || 'info'}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="donation-grid">
        <div className="donation-card">
          <h3>Pourquoi donner ?</h3>
          <ul>
            <li>Soutenir la formation et le quiz quotidien.</li>
            <li>Financer les actions sociales et la solidarite.</li>
            <li>Accompagner les initiatives educatives.</li>
          </ul>
          <div className="donation-highlight">
            <strong>Chaque contribution compte.</strong>
            <span>Merci pour votre soutien constant.</span>
          </div>
        </div>

        <form className="donation-card donation-form" onSubmit={handleSubmit}>
          <h3>Faire un don</h3>
          <div className="amount-grid">
            {formattedPreset.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`amount-btn ${Number(amount) === preset.value ? 'active' : ''}`}
                onClick={() => setAmount(String(preset.value))}
                disabled={isBusy}
              >
                {preset.label} {currency}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Montant</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Montant libre"
              disabled={isBusy}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Devise</label>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                disabled={isBusy}
              >
                {currencyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Motif</label>
              <select
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                disabled={isBusy}
              >
                {purposeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Votre nom"
              disabled={isBusy}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="exemple@mail.com"
              disabled={isBusy}
              required
            />
          </div>

          <div className="form-group">
            <label>Telephone</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Numero de contact (optionnel)"
              disabled={isBusy}
            />
          </div>

          <div className="form-group">
            <label>Message (optionnel)</label>
            <textarea
              rows="3"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Un mot pour l'association"
              disabled={isBusy}
            />
          </div>

          <button type="submit" className="donation-submit" disabled={isBusy}>
            {submitting ? 'Redirection...' : 'Continuer vers le paiement'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Donations;
