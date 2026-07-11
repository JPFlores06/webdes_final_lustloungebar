/* LUST Lounge & Bar — interactions */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- sticky header shadow on scroll ---- */
  const header = document.querySelector('.site-header');
  if (header){
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- mobile nav toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks){
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navLinks.classList.toggle('is-open', !isOpen);
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- nav: highlight the link for the current page ---- */
  const navAnchors = document.querySelectorAll('.nav-links a');
  if (navAnchors.length){
    const currentFile = window.location.pathname.split('/').pop() || 'LUST_BAR.html';
    navAnchors.forEach(a => {
      const href = a.getAttribute('href');
      if (href === currentFile){
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* ---- scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---- menu page: category tabs ---- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.menu-panel');
  if (tabButtons.length){
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        panels.forEach(panel => {
          panel.classList.toggle('is-active', panel.id === target);
        });
      });
    });
  }

  /* ---- FAQ accordion ---- */
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // close any other open items (single-open accordion)
      accordionItems.forEach(other => {
        if (other !== item){
          other.classList.remove('is-open');
          other.querySelector('.accordion-panel').style.maxHeight = null;
          other.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen){
        item.classList.remove('is-open');
        panel.style.maxHeight = null;
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- reservation form ---- */
  // Google Apps Script web app URL (see setup guide)
  const RESERVATION_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxHNGMYjTnchd3BKYS6X8L3jF08GFEt1yuyw98ncawxITWQHJPNtgmjl250OESxY5u97A/exec';

  const reserveForm = document.querySelector('#reservation-form');
  if (reserveForm){

    // guard against booking a past date
    const dateInput = reserveForm.querySelector('#date');
    if (dateInput){
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    // phone number: PH mobile format only — digits only, 09XXXXXXXXX (11 digits)
    const PH_PHONE_RE = /^09\d{9}$/;
    const phoneInput = reserveForm.querySelector('#phone');
    if (phoneInput){
      phoneInput.setAttribute('inputmode', 'numeric');
      phoneInput.setAttribute('pattern', '09[0-9]{9}');
      phoneInput.setAttribute('maxlength', '11');
      phoneInput.setAttribute('placeholder', '09XXXXXXXXX');
      phoneInput.addEventListener('input', () => {
        const digitsOnly = phoneInput.value.replace(/\D+/g, '').slice(0, 11);
        if (phoneInput.value !== digitsOnly){
          phoneInput.value = digitsOnly;
        }
      });
      phoneInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const digitsOnly = pasted.replace(/\D+/g, '');
        const start = phoneInput.selectionStart ?? phoneInput.value.length;
        const end = phoneInput.selectionEnd ?? phoneInput.value.length;
        const merged = phoneInput.value.slice(0, start) + digitsOnly + phoneInput.value.slice(end);
        phoneInput.value = merged.slice(0, 11);
      });
    }

    // email: strict, standards-shaped validation reused for both live and submit checks
    const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    const emailInput = reserveForm.querySelector('#email');

    const showError = (field, message) => {
      field.classList.add('has-error');
      const msg = field.querySelector('.error-msg');
      if (msg) msg.textContent = message;
    };
    const clearError = (field) => {
      field.classList.remove('has-error');
    };

    if (emailInput){
      emailInput.addEventListener('input', () => {
        const field = emailInput.closest('.field');
        if (!field) return;
        if (!emailInput.value.trim()){
          clearError(field);
          return;
        }
        if (EMAIL_RE.test(emailInput.value.trim())){
          clearError(field);
        } else {
          showError(field, 'Enter a valid email address.');
        }
      });
    }

    // table selection — guest picks a table, staff verifies manually
    const TABLES = [
      { id: 'VIP1', label: 'VIP 1', rate: 7500, pax: 7 },
      { id: 'VIP2', label: 'VIP 2', rate: 7500, pax: 7 },
      { id: 'VIP3', label: 'VIP 3', rate: 6000, pax: 6 },
      { id: 'VIP4', label: 'VIP 4', rate: 6000, pax: 6 },
      { id: 'VIP5', label: 'VIP 5', rate: 6000, pax: 6 },
      { id: 'C1',   label: 'C1',   rate: 2800, pax: 4 },
      { id: 'C2',   label: 'C2',   rate: 2800, pax: 4 },
      { id: 'C3',   label: 'C3',   rate: 2800, pax: 4 },
      { id: 'C4',   label: 'C4',   rate: 2800, pax: 4 },
      { id: 'C5',   label: 'C5',   rate: 2800, pax: 6 },
      { id: 'C6',   label: 'C6',   rate: 2800, pax: 6 },
      { id: 'C7',   label: 'C7',   rate: 2800, pax: 6 },
      { id: 'C8',   label: 'C8',   rate: 2800, pax: 6 }
    ];

    const tableField = reserveForm.querySelector('#table-field');
    const tableHint = reserveForm.querySelector('#table-select-hint');
    const tableGrid = reserveForm.querySelector('#table-grid');
    const tableHidden = reserveForm.querySelector('#table');

    function isReservationApiConfigured(){
      return RESERVATION_SHEET_URL && RESERVATION_SHEET_URL.indexOf('PASTE_YOUR') === -1;
    }

    function clearTableSelection(){
      tableHidden.value = '';
      tableGrid.querySelectorAll('.table-btn').forEach(btn => btn.classList.remove('is-selected'));
    }

    function renderTableGrid(){
      tableGrid.innerHTML = '';
      tableGrid.classList.add('is-visible');
      tableHint.className = 'table-select-hint';
      tableHint.textContent = 'Pick your preferred table below. We\u2019ll check real availability and confirm by email.';

      TABLES.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'table-btn';
        btn.innerHTML = `
          <span class="table-btn-name">${t.label}</span>
          <span class="table-btn-meta">₱${t.rate.toLocaleString()} · up to ${t.pax} pax</span>
        `;
        btn.addEventListener('click', () => {
          tableGrid.querySelectorAll('.table-btn').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          tableHidden.value = t.id;
          clearError(tableField);
        });
        tableGrid.appendChild(btn);
      });
    }
    renderTableGrid();

    reserveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      reserveForm.querySelectorAll('.field[data-required]').forEach(field => {
        const input = field.querySelector('input, select, textarea');
        clearError(field);
        if (!input.value.trim()){
          if (field === tableField){
            showError(field, 'Please select a preferred table.');
          } else {
            showError(field, 'This field is required.');
          }
          valid = false;
        } else if (input.type === 'email' && !EMAIL_RE.test(input.value.trim())){
          showError(field, 'Enter a valid email address.');
          valid = false;
        } else if (input.id === 'phone' && !PH_PHONE_RE.test(input.value.trim())){
          if (!input.value.trim().startsWith('09')){
            showError(field, 'Put a valid number.');
          } else {
            showError(field, 'Enter a valid PH mobile number (11 digits, starting with 09).');
          }
          valid = false;
        }
      });

      if (!valid){
        const firstError = reserveForm.querySelector('.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = reserveForm.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const formData = new FormData(reserveForm);
      const params = new URLSearchParams();
      formData.forEach((value, key) => params.append(key, value));
      params.append('submittedAt', new Date().toISOString());

      const finish = (message) => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        reserveForm.reset();
        clearTableSelection();
        showToast(message);
      };

      if (!isReservationApiConfigured()){
        // Sheet not connected yet — falls back to local-only confirmation.
        setTimeout(() => finish('Reservation request sent — we\u2019ll confirm your table by email.'), 900);
        return;
      }

      fetch(RESERVATION_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })
        .then(() => finish('Reservation request sent — we\u2019ll confirm your table by email.'))
        .catch(() => finish('Reservation received, but confirmation may be delayed — we\u2019ll reach out by email to verify.'));
    });
  }

  /* ---- events calendar modal ---- */
  const calendarModal = document.querySelector('#calendar-modal');
  const viewAllLink = document.querySelector('#events-view-all');

  if (calendarModal && viewAllLink){

    const grid = calendarModal.querySelector('#calendar-grid');
    const monthLabel = calendarModal.querySelector('#cal-month-label');
    const monthTag = calendarModal.querySelector('#cal-month-tag');
    const overlay = calendarModal.querySelector('#calendar-upcoming-overlay');
    const detail = calendarModal.querySelector('#calendar-event-detail');
    const prevBtn = calendarModal.querySelector('#cal-prev');
    const nextBtn = calendarModal.querySelector('#cal-next');

    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // recurring events for the 3-month rolling schedule
    const nthWeekday = (d, ...weeks) => weeks.includes(Math.ceil(d.getDate() / 7));

    const EVENT_DEFS = [
      {
        title: 'Industry Night',
        time: '6:00 PM',
        desc: 'Service industry crowd gets 20% off all night — just flash your work ID.',
        matches: (d) => d.getDay() === 1
      },
      {
        title: 'Trivia Tuesdays',
        time: '7:30 PM',
        desc: 'Team up with friends for bar trivia — winning table drinks free.',
        matches: (d) => d.getDay() === 2
      },
      {
        title: 'Beer Pong Tournament',
        time: '8:00 PM',
        desc: 'Bracket-style beer pong on our LED table — cash prize for the final two standing.',
        matches: (d) => d.getDay() === 3 && nthWeekday(d, 1, 3)
      },
      {
        title: 'Ladies Night',
        time: '9:00 PM',
        desc: 'Free drinks for ladies all night long!',
        matches: (d) => d.getDay() === 5
      },
      {
        title: 'Live Jazz Night',
        time: '8:00 PM',
        desc: 'Smooth jazz live from our resident trio — first and third Saturday of the month.',
        matches: (d) => d.getDay() === 6 && nthWeekday(d, 1, 3)
      },
      {
        title: 'DJ Takeover',
        time: '10:00 PM',
        desc: 'A rotating guest DJ takes the booth for a full night of sets — second and fourth Saturday.',
        matches: (d) => d.getDay() === 6 && nthWeekday(d, 2, 4)
      },
      {
        title: 'Retro Party',
        time: '9:00 PM',
        desc: 'Throwback hits all night — 80s, 90s, and Y2K classics.',
        matches: (d) => d.getDay() === 0 && nthWeekday(d, 3)
      }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // rolling 3-month window: current month through 2 months out gets real events
    const windowStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const windowEndExclusive = new Date(today.getFullYear(), today.getMonth() + 3, 1);

    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();

    const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const monthInWindow = (year, month) => {
      const monthStart = new Date(year, month, 1);
      return monthStart >= windowStart && monthStart < windowEndExclusive;
    };

    const eventsForDate = (date) => {
      if (!monthInWindow(date.getFullYear(), date.getMonth())) return [];
      return EVENT_DEFS.filter(ev => ev.matches(date));
    };

    const renderDetail = (date, events) => {
      if (!events.length){
        detail.innerHTML = '<p class="cal-hint">Tap a highlighted date to see event details.</p>';
        return;
      }
      const dateLabel = `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      detail.innerHTML = `<p class="cal-hint" style="margin-bottom:14px; color:var(--gold-bright); text-transform:uppercase; letter-spacing:0.08em; font-size:11px; font-weight:700;">${dateLabel}</p>` +
        events.map(ev => `
          <div class="cal-event-item">
            <div class="cal-event-time">${ev.time}</div>
            <div>
              <h5>${ev.title}</h5>
              <p>${ev.desc}</p>
            </div>
          </div>
        `).join('');
    };

    const renderCalendar = () => {
      grid.innerHTML = '';
      detail.innerHTML = '<p class="cal-hint">Tap a highlighted date to see event details.</p>';

      monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

      const inWindow = monthInWindow(viewYear, viewMonth);
      overlay.classList.toggle('is-active', !inWindow);

      if (inWindow){
        const monthsFromNow = (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());
        monthTag.textContent = monthsFromNow === 0 ? 'This Month' : (monthsFromNow === 1 ? 'Next Month' : 'Upcoming');
      } else {
        monthTag.textContent = '';
      }

      const firstOfMonth = new Date(viewYear, viewMonth, 1);
      const startOffset = firstOfMonth.getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

      for (let i = 0; i < totalCells; i++){
        const dayNum = i - startOffset + 1;
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (dayNum < 1 || dayNum > daysInMonth){
          cell.classList.add('is-outside');
          grid.appendChild(cell);
          continue;
        }

        const cellDate = new Date(viewYear, viewMonth, dayNum);
        cell.textContent = String(dayNum);

        if (isSameDay(cellDate, today)) cell.classList.add('is-today');

        const events = eventsForDate(cellDate);
        if (events.length){
          cell.classList.add('has-event');
          const dot = document.createElement('span');
          dot.className = 'cal-dot';
          cell.appendChild(dot);
          cell.setAttribute('role', 'button');
          cell.setAttribute('tabindex', '0');
          cell.setAttribute('aria-label', `${MONTH_NAMES[viewMonth]} ${dayNum} — ${events.map(e => e.title).join(', ')}`);

          const selectDay = () => {
            grid.querySelectorAll('.calendar-day.is-selected').forEach(d => d.classList.remove('is-selected'));
            cell.classList.add('is-selected');
            renderDetail(cellDate, events);
          };
          cell.addEventListener('click', selectDay);
          cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' '){
              e.preventDefault();
              selectDay();
            }
          });
        }

        grid.appendChild(cell);
      }
    };

    const openCalendar = () => {
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      renderCalendar();
      calendarModal.classList.add('is-open');
      calendarModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeCalendar = () => {
      calendarModal.classList.remove('is-open');
      calendarModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      openCalendar();
    });

    calendarModal.querySelectorAll('[data-close-calendar]').forEach(el => {
      el.addEventListener('click', closeCalendar);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && calendarModal.classList.contains('is-open')) closeCalendar();
    });

    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0){ viewMonth = 11; viewYear -= 1; }
      renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11){ viewMonth = 0; viewYear += 1; }
      renderCalendar();
    });
  }

  /* ---- floor plan modal ---- */
  const floorplanModal = document.querySelector('#floorplan-modal');
  const openFloorplanBtn = document.querySelector('#open-floorplan-modal');

  if (floorplanModal && openFloorplanBtn){
    function openFloorplanModal(){
      floorplanModal.classList.add('is-open');
      floorplanModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeFloorplanModal(){
      floorplanModal.classList.remove('is-open');
      floorplanModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    openFloorplanBtn.addEventListener('click', openFloorplanModal);
    floorplanModal.querySelectorAll('[data-close-floorplan]').forEach(el => {
      el.addEventListener('click', closeFloorplanModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && floorplanModal.classList.contains('is-open')) closeFloorplanModal();
    });
  }

  /* ---- write a review ---- */
  const reviewModal = document.querySelector('#review-modal');
  const openReviewBtn = document.querySelector('#open-review-modal');
  const reviewGrid = document.querySelector('#review-grid');

  if (reviewModal && reviewGrid){
    const starInput = reviewModal.querySelector('#star-input');
    const starIcons = starInput.querySelectorAll('svg');
    const ratingField = reviewModal.querySelector('#review-rating');
    const ratingError = reviewModal.querySelector('#rating-error');
    const nameField = reviewModal.querySelector('#review-name');
    const commentField = reviewModal.querySelector('#review-comment');
    const photoField = reviewModal.querySelector('#review-photo');
    const photoPreview = reviewModal.querySelector('#review-photo-preview');
    const form = reviewModal.querySelector('#review-form');

    // Google Apps Script web app URL — reviews fall back to this browser only if empty
    const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxz5QBJOYhePcDyKMYNo5H0VMCI_6dMtXufGi-W1YrpQL01mEIM66A2b-NbzK2pHeGHgg/exec';
    const STORAGE_KEY = 'lustReviews'; // used only as an offline fallback

    function openReviewModal(){
      reviewModal.classList.add('is-open');
      reviewModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeReviewModal(){
      reviewModal.classList.remove('is-open');
      reviewModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    if (openReviewBtn) openReviewBtn.addEventListener('click', openReviewModal);
    reviewModal.querySelectorAll('[data-close-review]').forEach(el => {
      el.addEventListener('click', closeReviewModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && reviewModal.classList.contains('is-open')) closeReviewModal();
    });

    /* star selector */
    function setStars(value){
      ratingField.value = value;
      starIcons.forEach(icon => {
        icon.classList.toggle('is-active', Number(icon.dataset.value) <= value);
      });
    }
    starIcons.forEach(icon => {
      icon.addEventListener('click', () => setStars(Number(icon.dataset.value)));
    });

    /* photo preview */
    let photoDataUrl = '';
    photoField.addEventListener('change', () => {
      const file = photoField.files && photoField.files[0];
      if (!file){ photoDataUrl = ''; photoPreview.classList.remove('is-active'); photoPreview.innerHTML = ''; return; }
      const reader = new FileReader();
      reader.onload = () => {
        photoDataUrl = reader.result;
        photoPreview.innerHTML = `<img src="${photoDataUrl}" alt="Review photo preview">`;
        photoPreview.classList.add('is-active');
      };
      reader.readAsDataURL(file);
    });

    function starsMarkup(count){
      let html = '';
      for (let i = 1; i <= 5; i++){
        html += `<svg viewBox="0 0 24 24"${i > count ? ' style="opacity:.35"' : ''}><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 21.5 12 17.8 5.5 21.5 7 14.5 2 9.5 9 9"/></svg>`;
      }
      return html;
    }

    function initials(name){
      return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    }

    function buildCard(review){
      const card = document.createElement('div');
      card.className = 'review-card' + (review.photo ? '' : ' is-user-submitted');
      card.innerHTML = `
        <div class="review-photo">
          ${review.photo ? `<img src="${review.photo}" alt="Photo from ${review.name}'s review">` : `<span class="no-photo-label">LUST Lounge &amp; Bar</span>`}
        </div>
        <div class="review-body">
          <div class="review-stars">${starsMarkup(review.rating)}</div>
          <p class="review-quote-en" style="margin-bottom:18px;">"${review.comment}"</p>
          <div class="review-author">
            <div class="review-avatar">${initials(review.name)}</div>
            <div>
              <div class="review-author-name">${review.name}</div>
              <div class="review-author-meta">Visited · Makati Branch</div>
            </div>
          </div>
        </div>`;
      return card;
    }

    function isApiConfigured(){
      return SHEETS_API_URL && SHEETS_API_URL.indexOf('PASTE_YOUR') === -1;
    }

    function loadLocalReviews(){
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (err){ stored = []; }
      stored.forEach(review => reviewGrid.prepend(buildCard(review)));
    }

    function loadStoredReviews(){
      if (!isApiConfigured()){
        // No Sheet connected yet — fall back to this browser's local reviews.
        loadLocalReviews();
        return;
      }
      fetch(SHEETS_API_URL)
        .then(res => res.json())
        .then(reviews => {
          reviews.forEach(review => reviewGrid.prepend(buildCard(review)));
        })
        .catch(err => {
          console.error('Could not load reviews from Google Sheet:', err);
          loadLocalReviews();
        });
    }
    loadStoredReviews();

    function escapeHtml(str){
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = Number(ratingField.value);
      const name = nameField.value.trim();
      const comment = commentField.value.trim();

      nameField.closest('.field').classList.toggle('has-error', !name);
      commentField.closest('.field').classList.toggle('has-error', !comment);
      ratingError.style.display = rating ? 'none' : 'block';

      if (!rating || !name || !comment) return;

      const review = {
        rating,
        name: escapeHtml(name),
        comment: escapeHtml(comment),
        photo: photoDataUrl
      };

      reviewGrid.prepend(buildCard(review));

      if (isApiConfigured()){
        // sent to the Google Sheet; text/plain avoids a CORS preflight
        fetch(SHEETS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(review)
        }).catch(err => {
          console.error('Could not save review to Google Sheet:', err);
        });
      } else {
        // No Sheet connected yet — save locally as a fallback so the demo still works.
        let stored = [];
        try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (err){ stored = []; }
        stored.unshift(review);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch (err){ /* storage full or unavailable */ }
      }

      form.reset();
      setStars(0);
      photoDataUrl = '';
      photoPreview.classList.remove('is-active');
      photoPreview.innerHTML = '';
      closeReviewModal();
      showToast('Thanks for your review!');
    });
  }

  /* ---- toast helper ---- */
  function showToast(message){
    let toast = document.querySelector('.toast');
    if (!toast){
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector('span').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
  }

  /* ---- footer social links: coming soon ---- */
  document.querySelectorAll('.social-row a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Coming soon!');
    });
  });

  /* ---- LUST chat widget ---- */
  (function initLustChat(){

    const CONTACT_LINES = `📞 <a href="tel:+639123456789">+63 912 345 6789</a><br>
      ✉️ <a href="mailto:info@lustlounge.com">info@lustlounge.com</a>`;

    const CONTACT_HTML = `If I don't have that answer on hand, please reach out directly:<br>${CONTACT_LINES}`;
    const CONTACT_CLOSING_HTML = `That covers everything I can help with here! For anything else, please message us directly:<br>${CONTACT_LINES}`;

    const FAQS = [
      {
        q: 'Do I need a reservation?',
        keywords: ['reservation','reserve','book','booking','table','walk in','walkin'],
        a: 'Walk-ins are always welcome, but we recommend reserving a table ahead of time, especially on weekends and during special events, to guarantee seating.'
      },
      {
        q: 'Do all branches have the same menu?',
        keywords: ['branch','branches','menu same','location menu','all branch'],
        a: 'Yes — our Makati, Quezon City, Taguig, and Mandaluyong branches all serve the same core menu, including our Filipino Classics selection, though a few seasonal items may vary by location.'
      },
      {
        q: 'What is your dress code?',
        keywords: ['dress code','dress','attire','wear','outfit','clothing'],
        a: "We keep it smart casual — collared shirts and closed shoes are encouraged. Flip-flops, sleeveless shirts, and sportswear aren't allowed after 7:00 PM."
      },
      {
        q: 'Do you have a corkage fee?',
        keywords: ['corkage','outside bottle','own bottle','own alcohol'],
        a: 'Yes, outside bottles are subject to a corkage fee. Rates vary by bottle type, so please check with our staff or contact us ahead of your visit.'
      },
      {
        q: 'Are minors allowed?',
        keywords: ['minor','kids','children','age','id','under 18','under age'],
        a: 'LUST Lounge & Bar is a 21-and-up venue after 6:00 PM. Valid government-issued ID is required at the door.'
      },
      {
        q: 'Do you have parking available?',
        keywords: ['parking','park','valet','car'],
        a: 'Yes, complimentary parking is available for guests right outside the venue, with valet service offered on weekends at select branches.'
      },
      {
        q: 'What payment methods do you accept?',
        keywords: ['payment','pay','cash','card','credit','debit','gcash','maya','e-wallet','ewallet'],
        a: 'We accept cash, all major credit and debit cards, and popular e-wallets including GCash and Maya.'
      },
      {
        q: 'What are your operating hours?',
        keywords: ['hours','open','close','time','schedule','opening'],
        a: 'We\'re open Mon–Thu 5:00 PM–1:00 AM, Fri–Sat 5:00 PM–2:00 AM, and Sunday 5:00 PM–12:00 AM.'
      },
      {
        q: 'Where are you located?',
        keywords: ['where','location','address','branch address','directions'],
        a: 'We have branches in Makati, Quezon City, Taguig, and Mandaluyong. Let us know which one you\'re headed to and we can share the exact address.'
      }
    ];

    function normalize(str){
      return str.toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
    }

    function findAnswer(rawInput){
      const input = normalize(rawInput);
      if (!input) return null;

      let best = null;
      let bestScore = 0;

      FAQS.forEach(item => {
        let score = 0;
        item.keywords.forEach(kw => {
          if (input.includes(kw)) score += kw.split(' ').length; // longer phrase matches score higher
        });
        // also credit if words from the question itself overlap
        const qWords = normalize(item.q).split(' ').filter(w => w.length > 3);
        qWords.forEach(w => { if (input.includes(w)) score += 0.5; });

        if (score > bestScore){
          bestScore = score;
          best = item;
        }
      });

      return bestScore >= 1 ? best : null;
    }

    // ---- build DOM ----
    const launcher = document.createElement('button');
    launcher.className = 'lust-chat-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = `
      <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.1-.6L3 21l1.7-5.1a8.3 8.3 0 0 1-.7-3.4A8.4 8.4 0 0 1 12.5 4a8.4 8.4 0 0 1 8.5 7.5z"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      <span class="lust-chat-badge"></span>
    `;

    const win = document.createElement('div');
    win.className = 'lust-chat-window';
    win.innerHTML = `
      <div class="lust-chat-header">
        <svg class="logo-mark" viewBox="0 0 32 32" fill="none">
          <path d="M8 6h16l-6.5 9v9M12.5 24h7" stroke="#F3E9DC" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16" cy="6" r="9" stroke="#C9A24B" stroke-width="1" opacity="0.6"/>
        </svg>
        <div class="lust-chat-header-text">
          <h4>LUST Assistant</h4>
          <p>Usually replies instantly</p>
        </div>
      </div>
      <div class="lust-chat-body" id="lustChatBody"></div>
      <div class="lust-chat-footer">
        <input type="text" class="lust-chat-input" id="lustChatInput" placeholder="Ask a question..." autocomplete="off">
        <button class="lust-chat-send" id="lustChatSend" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 9-18 9 4-9-4-9z"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(win);

    const body = win.querySelector('#lustChatBody');
    const input = win.querySelector('#lustChatInput');
    const sendBtn = win.querySelector('#lustChatSend');

    const askedQuestions = new Set();

    function addMessage(html, who){
      const msg = document.createElement('div');
      msg.className = `lust-msg ${who}`;
      msg.innerHTML = html;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function removeExistingChips(){
      const old = body.querySelector('.lust-chat-suggestions');
      if (old) old.remove();
    }

    function addChips(list){
      removeExistingChips();
      if (!list.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'lust-chat-suggestions';
      list.slice(0, 4).forEach(item => {
        const chip = document.createElement('button');
        chip.className = 'lust-chip';
        chip.textContent = item.q;
        chip.addEventListener('click', () => {
          removeExistingChips();
          addMessage(item.q, 'user');
          answerWith(item);
        });
        wrap.appendChild(chip);
      });
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    }

    function showFollowUps(cameFromFallback){
      const remaining = FAQS.filter(item => !askedQuestions.has(item.q));
      if (remaining.length){
        addChips(remaining);
      } else if (!cameFromFallback){
        addMessage(CONTACT_CLOSING_HTML, 'bot');
      }
      // fallback messages already include contact info, so skip repeating it here
    }

    function answerWith(item){
      askedQuestions.add(item.q);
      setTimeout(() => {
        addMessage(item.a, 'bot');
        showFollowUps(false);
      }, 300);
    }

    let greeted = false;
    function greet(){
      if (greeted) return;
      greeted = true;
      addMessage("Hi! 👋 I'm the LUST Assistant. Ask me anything about reservations, hours, dress code, and more.", 'bot');
      showFollowUps(false);
    }

    function handleUserInput(text){
      const clean = text.trim();
      if (!clean) return;
      removeExistingChips();
      addMessage(clean, 'user');
      input.value = '';

      setTimeout(() => {
        const match = findAnswer(clean);
        if (match){
          askedQuestions.add(match.q);
          addMessage(match.a, 'bot');
          showFollowUps(false);
        } else {
          addMessage(`I don't have an answer for that just yet. ${CONTACT_HTML}`, 'bot');
          showFollowUps(true);
        }
      }, 350);
    }

    sendBtn.addEventListener('click', () => handleUserInput(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUserInput(input.value);
    });

    launcher.addEventListener('click', () => {
      const isOpen = win.classList.toggle('is-open');
      launcher.classList.toggle('is-open', isOpen);
      if (isOpen){
        greet();
        input.focus();
      }
    });

  })();

});
