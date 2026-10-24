// Local design-system demonstrations only. No API requests or persistence.
document.querySelectorAll('[data-indeterminate]').forEach(input => { input.indeterminate = true; });
let toastTimer;
function notify(message) {
  const toast = document.querySelector('[data-demo-toast]');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('button');
  if (!trigger) return;
  if (trigger.dataset.openDialog) document.getElementById(trigger.dataset.openDialog)?.showModal();
  if (trigger.hasAttribute('data-show-toast')) notify('Sample notification. No platform changes were made.');
  if (trigger.dataset.selectField) {
    const input = document.getElementById(trigger.dataset.selectField);
    input?.focus();
    input?.select();
    notify('Sample value selected. You can copy it with your usual shortcut.');
  }
});
document.addEventListener('input', event => {
  const id = event.target.dataset.rangeOutput;
  if (id) document.getElementById(id).value = event.target.value;
});
document.addEventListener('change', event => {
  const id = event.target.dataset.choiceOutput;
  if (id) document.getElementById(id).value = event.target.value;
});
document.addEventListener('submit', event => {
  if (!event.target.hasAttribute('data-demo-form')) return;
  event.preventDefault();
  const output = event.target.querySelector('output');
  if (output) output.value = 'Valid sample. Nothing was sent or saved.';
});
document.addEventListener('reset', event => {
  if (event.target.hasAttribute('data-demo-form')) {
    const output = event.target.querySelector('output');
    if (output) output.value = '';
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('details[data-demo-disclosure][open]').forEach(el => { el.open = false; });
});
