import { fsSetPage, fsTrack } from './main.js';

fsSetPage({
  pageName: 'Contact',
  page_type: 'marketing'
});

const form = document.getElementById('contact-form');
const status = document.getElementById('contact-status');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const topic = (data.get('topic') || '').toString();
    const messageLen = ((data.get('message') || '').toString()).length;

    // Track the conversion. Do NOT send name/email/message body — masked anyway,
    // but no point sending PII as event properties.
    fsTrack('contact_form_submitted', {
      topic,
      message_length: messageLen
    });

    form.reset();
    status.textContent = 'Thanks — we got your message (demo only, nothing was actually sent).';
    status.style.color = 'var(--color-success)';
  });
}
