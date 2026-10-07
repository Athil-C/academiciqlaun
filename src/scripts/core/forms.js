import { gsap } from 'gsap';
import { env, $$, toast } from './env.js';

const rules = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Tell us your name'),
  phone: (v) => (/^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')) ? '' : '10-digit mobile number'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'A valid work email'),
  company: (v) => (v.trim().length >= 2 ? '' : 'Your company name'),
  required: (v) => (v.trim() ? '' : 'Required'),
};

function validate(field) {
  const input = field.querySelector('input, textarea');
  if (!input) return true;
  const rule = rules[field.dataset.rule];
  const message = rule ? rule(input.value) : '';
  const slot = field.querySelector('.field__error');
  field.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (slot) slot.textContent = message;
  return !message;
}

/**
 * Forms hand off to a real channel instead of pretending to submit:
 *   data-form="whatsapp" â†’ opens a pre-written WhatsApp chat with admissions
 *   data-form="mail"     â†’ opens a pre-written email
 * Swap `handoff` for a fetch() to your CRM when there is an endpoint.
 */
export function initForms(root = document) {
  $$('form[data-form]', root).forEach((form) => {
    const fields = $$('.field[data-rule]', form);

    fields.forEach((field) => {
      const input = field.querySelector('input, textarea');
      input?.addEventListener('blur', () => input.value && validate(field));
      input?.addEventListener('input', () => field.classList.contains('is-invalid') && validate(field));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = fields.map(validate).every(Boolean);
      if (!ok) {
        const bad = form.querySelector('.field.is-invalid');
        bad?.querySelector('input, textarea')?.focus();
        if (!env.reduced && bad) gsap.fromTo(bad, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      handoff(form, data);
    });
  });
}

function handoff(form, data) {
  const kind = form.dataset.form;
  let href = '';

  if (kind === 'whatsapp') {
    const lines = [
      `Hi AcademiQ, I'm ${data.name}.`,
      data.status && `I'm currently: ${data.status}.`,
      data.domain && `Interested in: ${data.domain}.`,
      data.mode && `Preferred mode: ${data.mode}.`,
      'I want to know more about the AcademiQ ecosystem and opportunities.',
    ].filter(Boolean);
    href = `https://wa.me/${form.dataset.to}?text=${encodeURIComponent(lines.join('\n'))}`;
  } else if (kind === 'mail') {
    const subject = `Collaboration enquiry â€” ${data.company || 'via academiq.org'}`;
    const body = [
      `Name: ${data.name}`,
      `Company: ${data.company}`,
      data.roles && `Roles: ${data.roles}`,
      '',
      data.message || '',
    ]
      .filter((l) => l !== undefined && l !== false)
      .join('\n');
    href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  if (!href) return;
  toast(kind === 'whatsapp' ? 'Opening WhatsApp' : 'Opening your mail app');
  form.classList.add('is-sent');
  const done = form.querySelector('[data-form-done]');
  if (done) {
    done.hidden = false;
    if (!env.reduced) gsap.fromTo(done, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
  }
  setTimeout(() => {
    if (kind === 'mail') window.location.href = href;
    else window.open(href, '_blank', 'noopener');
  }, 350);
}

