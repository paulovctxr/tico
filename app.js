'use strict';
const form = document.querySelector('#booking-form');
const checkin = document.querySelector('#checkin');
const checkout = document.querySelector('#checkout');
const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today = localDate(new Date());
checkin.min = today;
checkout.min = today;
function nextDay(value) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate()+1); return localDate(date); }
checkin.addEventListener('change', () => { if (!checkin.value) return; checkout.min = nextDay(checkin.value); if (checkout.value && checkout.value <= checkin.value) checkout.value = ''; });
const formatDate = value => value.split('-').reverse().join('/');
form.addEventListener('submit', event => {
  event.preventDefault();
  const error = document.querySelector('#form-error');
  error.textContent = '';
  if (!form.reportValidity()) return;
  if (checkin.value < today || checkout.value <= checkin.value) { error.textContent = 'Escolha uma chegada a partir de hoje e uma saída depois da chegada.'; checkout.focus(); return; }
  const adults = document.querySelector('#adults').value;
  const children = document.querySelector('#children').value;
  const notes = document.querySelector('#notes').value.trim();
  const message = `Olá, Ti.co Pousada! Gostaria de consultar uma estadia em Campos do Jordão.\n\nChegada: ${formatDate(checkin.value)}\nSaída: ${formatDate(checkout.value)}\nAdultos: ${adults}\nCrianças: ${children}${children !== '0' ? '\nPosso informar as idades das crianças no atendimento.' : ''}${notes ? `\n\n${notes}` : ''}\n\nQuais acomodações estão disponíveis, quais são os valores e as condições de reserva?`;
  window.location.href = `https://wa.me/5512996182586?text=${encodeURIComponent(message)}`;
});
const stayText = { casal: 'Uma pausa a dois merece um lugar acolhedor. Consulte a acomodação disponível para as suas datas.', familia: 'A pousada conta com opções de quartos familiares e espaço infantil. Informe o grupo e as idades das crianças para consultar a melhor acomodação.' };
document.querySelectorAll('.stay').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.stay').forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); }); document.querySelector('#stay-description').textContent = stayText[button.dataset.stay]; }));
const lightbox = document.querySelector('#lightbox');
let lastPhotoButton;
document.querySelectorAll('.gallery-item').forEach(button => button.addEventListener('click', () => { lastPhotoButton = button; const photo = button.querySelector('img'); document.querySelector('#lightbox-image').src = photo.src; document.querySelector('#lightbox-image').alt = photo.alt; document.querySelector('#lightbox-caption').textContent = photo.alt; lightbox.showModal(); }));
document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) { const rect = lightbox.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close(); } });
lightbox.addEventListener('close', () => lastPhotoButton?.focus());
if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => { document.querySelector('.mobile-cta').classList.toggle('hidden', entries[0].isIntersecting); }, {threshold:0.15}); observer.observe(document.querySelector('#reserva')); }
