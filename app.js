/* ==========================================================================
       MedPulse JavaScript Application (app.js)
       ========================================================================== */

    // Mock initial state data
    const INITIAL_APPOINTMENTS = [
      {
        id: 'MP-1021',
        patientName: 'Eleanor Vance',
        phone: '+1 (555) 234-5678',
        doctor: 'Dr. Sarah Jenkins',
        specialty: 'Cardiology',
        date: '2026-11-05',
        slot: '10:30 AM',
        reason: 'Routine ECG checkup',
        status: 'Scheduled'
      },
      {
        id: 'MP-4032',
        patientName: 'Marcus Miller',
        phone: '+1 (555) 987-6543',
        doctor: 'Dr. Rajesh Patel',
        specialty: 'Neurology',
        date: '2026-11-08',
        slot: '01:30 PM',
        reason: 'Migraine consultation',
        status: 'Pending'
      }
    ];

    let appointments = JSON.parse(localStorage.getItem('medpulse_appointments')) || INITIAL_APPOINTMENTS;
    let isAdminUnlocked = false;
    let activeCodeTab = 'html';

    // Save to LocalStorage
    function saveAppointments() {
      localStorage.setItem('medpulse_appointments', JSON.stringify(appointments));
    }

    // Switch Navigation Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
      
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-brand-600', 'text-white', 'shadow');
        btn.classList.add('text-slate-400');
      });

      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) targetTab.classList.remove('hidden');

      const activeNavBtn = document.getElementById(`nav-${tabId}`);
      if (activeNavBtn) {
        activeNavBtn.classList.add('bg-brand-600', 'text-white', 'shadow');
        activeNavBtn.classList.remove('text-slate-400');
      }

      if (tabId === 'my-appointments') renderPatientAppointments();
      if (tabId === 'admin') renderAdminDashboard();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleMobileMenu() {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    }

    // Toast Notifications
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const isSuccess = type === 'success';

      toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-xl border bg-slate-900 ${isSuccess ? 'border-emerald-500/50' : 'border-rose-500/50'} text-white shadow-xl transition-all duration-300 transform translate-y-2 opacity-0`;
      toast.innerHTML = `
        <i class="fa-solid ${isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'} text-lg"></i>
        <span class="text-xs font-semibold">${message}</span>
      `;

      container.appendChild(toast);
      setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // Patient Registration
    function handleRegistration(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const phone = document.getElementById('reg-phone').value;

      showToast(`Registration completed for ${name}!`, 'success');
      
      document.getElementById('book-patient-name').value = name;
      document.getElementById('book-patient-phone').value = phone;

      switchTab('booking');
    }

    function handleFileSelected(input) {
      const status = document.getElementById('file-status');
      if (input.files && input.files[0]) {
        status.innerText = `Uploaded: ${input.files[0].name}`;
        status.classList.add('text-brand-400');
      }
    }

    // Appointment Booking
    function handleAppointmentBooking(e) {
      e.preventDefault();

      const selectedDoctorRadio = document.querySelector('input[name="booking-doctor"]:checked');
      const doctorName = selectedDoctorRadio ? selectedDoctorRadio.value : 'Dr. Sarah Jenkins';
      const doctorSpec = selectedDoctorRadio ? selectedDoctorRadio.getAttribute('data-specialty') : 'Cardiology';

      const patientName = document.getElementById('book-patient-name').value;
      const phone = document.getElementById('book-patient-phone').value;
      const date = document.getElementById('book-date').value;
      const slot = document.getElementById('book-slot').value;
      const reason = document.getElementById('book-reason').value || 'General Visit';

      const newAppointment = {
        id: 'MP-' + Math.floor(1000 + Math.random() * 9000),
        patientName,
        phone,
        doctor: doctorName,
        specialty: doctorSpec,
        date,
        slot,
        reason,
        status: 'Scheduled'
      };

      appointments.unshift(newAppointment);
      saveAppointments();

      showToast(`Visit booked with ${doctorName}!`, 'success');
      document.getElementById('booking-form').reset();

      switchTab('my-appointments');
    }

    function quickSelectDoctor(name, spec) {
      switchTab('booking');
      const radio = document.querySelector(`input[name="booking-doctor"][value="${name}"]`);
      if (radio) radio.checked = true;
    }

    function filterDoctorCards() {
      const filter = document.getElementById('specialty-filter').value;
      const cards = document.querySelectorAll('.doctor-select-card');

      cards.forEach(card => {
        const spec = card.getAttribute('data-spec');
        if (filter === 'ALL' || spec === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Patient Dashboard Rendering
    function renderPatientAppointments() {
      const container = document.getElementById('patient-appointments-container');
      const query = (document.getElementById('appointment-search')?.value || '').toLowerCase();
      container.innerHTML = '';

      const filtered = appointments.filter(a => 
        a.patientName.toLowerCase().includes(query) || 
        a.doctor.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full glass-card p-8 rounded-2xl text-center text-slate-400">
            <i class="fa-solid fa-calendar-xmark text-3xl mb-2 text-slate-600"></i>
            <p class="text-xs">No matching appointments found.</p>
          </div>
        `;
        return;
      }

      filtered.forEach(app => {
        let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        if (app.status === 'Pending') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        if (app.status === 'Canceled') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

        const card = document.createElement('div');
        card.className = 'glass-card p-5 rounded-2xl border border-slate-800 space-y-3';
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-mono font-bold text-slate-400">${app.id}</span>
            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${badgeClass}">${app.status}</span>
          </div>
          <div>
            <h4 class="text-xs font-bold text-white">${app.doctor} (${app.specialty})</h4>
            <p class="text-[11px] text-slate-400"><i class="fa-regular fa-calendar text-brand-400 mr-1"></i>${app.date} at ${app.slot}</p>
            <p class="text-[11px] text-slate-400"><i class="fa-solid fa-user text-brand-400 mr-1"></i>Patient: ${app.patientName}</p>
          </div>
          ${app.status !== 'Canceled' ? `
            <button onclick="cancelAppointment('${app.id}')" class="w-full py-1.5 text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-500/20 transition-all">
              Cancel Visit
            </button>
          ` : ''}
        `;
        container.appendChild(card);
      });
    }

    function cancelAppointment(id) {
      const target = appointments.find(a => a.id === id);
      if (target) {
        target.status = 'Canceled';
        saveAppointments();
        renderPatientAppointments();
        if (isAdminUnlocked) renderAdminDashboard();
        showToast(`Appointment ${id} canceled.`, 'error');
      }
    }

    // Admin Access Modal
    function openAdminModal() {
      if (isAdminUnlocked) switchTab('admin');
      else document.getElementById('admin-passkey-modal').classList.remove('hidden');
    }

    function closeAdminModal() {
      document.getElementById('admin-passkey-modal').classList.add('hidden');
    }

    function verifyAdminPasskey(e) {
      e.preventDefault();
      const pin = document.getElementById('admin-pin-input').value;
      if (pin === '123456') {
        isAdminUnlocked = true;
        closeAdminModal();
        switchTab('admin');
        showToast('Admin Mode Unlocked', 'success');
      } else {
        showToast('Invalid PIN Code', 'error');
      }
    }

    function lockAdmin() {
      isAdminUnlocked = false;
      switchTab('home');
      showToast('Logged out of Admin Mode', 'success');
    }

    // Admin Dashboard Render
    function renderAdminDashboard() {
      document.getElementById('stat-total').innerText = appointments.length;
      document.getElementById('stat-scheduled').innerText = appointments.filter(a => a.status === 'Scheduled').length;
      document.getElementById('stat-pending').innerText = appointments.filter(a => a.status === 'Pending').length;
      document.getElementById('stat-canceled').innerText = appointments.filter(a => a.status === 'Canceled').length;

      const tbody = document.getElementById('admin-appointments-table');
      tbody.innerHTML = '';

      appointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="py-3 px-4 font-bold text-white">${app.patientName}<br><span class="text-[10px] text-slate-400 font-normal">${app.phone}</span></td>
          <td class="py-3 px-4">${app.doctor}<br><span class="text-[10px] text-brand-400 font-normal">${app.specialty}</span></td>
          <td class="py-3 px-4">${app.date}<br><span class="text-[10px] text-slate-400 font-normal">${app.slot}</span></td>
          <td class="py-3 px-4"><span class="font-semibold text-xs">${app.status}</span></td>
          <td class="py-3 px-4 text-right space-x-2">
            ${app.status !== 'Scheduled' ? `<button onclick="updateStatus('${app.id}', 'Scheduled')" class="px-2 py-1 text-[10px] text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/30">Approve</button>` : ''}
            ${app.status !== 'Canceled' ? `<button onclick="updateStatus('${app.id}', 'Canceled')" class="px-2 py-1 text-[10px] text-rose-400 bg-rose-500/10 rounded border border-rose-500/30">Cancel</button>` : ''}
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function updateStatus(id, newStatus) {
      const target = appointments.find(a => a.id === id);
      if (target) {
        target.status = newStatus;
        saveAppointments();
        renderAdminDashboard();
        showToast(`Status updated to ${newStatus}`, 'success');
      }
    }

    // Source Code Exporter Modal
    function openCodeExporter() {
      document.getElementById('code-exporter-modal').classList.remove('hidden');
      showCodeFile('html');
    }

    function closeCodeExporter() {
      document.getElementById('code-exporter-modal').classList.add('hidden');
    }

    function showCodeFile(type) {
      activeCodeTab = type;
      
      // Update Tab Highlights
      document.querySelectorAll('#code-exporter-modal button[id^="code-tab-"]').forEach(btn => {
        btn.classList.remove('text-brand-400', 'border-brand-400');
        btn.classList.add('text-slate-400', 'border-transparent');
      });

      const activeBtn = document.getElementById(`code-tab-${type}`);
      if (activeBtn) {
        activeBtn.classList.add('text-brand-400', 'border-brand-400');
        activeBtn.classList.remove('text-slate-400', 'border-transparent');
      }

      const viewer = document.getElementById('code-viewer');
      if (type === 'css') {
        viewer.textContent = document.getElementById('custom-styles').innerHTML.trim();
      } else if (type === 'js') {
        viewer.textContent = document.getElementById('custom-script').innerHTML.trim();
      } else {
        viewer.textContent = document.documentElement.outerHTML;
      }
    }

    function copyActiveCode() {
      const viewerText = document.getElementById('code-viewer').textContent;
      
      const textarea = document.createElement('textarea');
      textarea.value = viewerText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      showToast(`Copied ${activeCodeTab.toUpperCase()} code to clipboard!`, 'success');
    }

    // Init defaults
    window.onload = function() {
      const today = new Date().toISOString().split('T')[0];
      const bookDate = document.getElementById('book-date');
      if (bookDate) bookDate.value = today;
    }
