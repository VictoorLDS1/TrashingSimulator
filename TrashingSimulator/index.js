(() => {
    'use strict';
  
    const DESK_CAPACITY = 4;
    const CAP_WAIT = 5;
    const MAX_FINISHED_KEEP = 200;
  
    let desk = [];
    let waitingQueue = [];
    let pausedQueue = [];
    let finishedQueue = [];
    let processCounter = 1;
    let tickInterval = null;
    let arrivalIntervalId = null;
  
    const deskGridEl = document.getElementById('deskGrid');
    const waitingListEl = document.getElementById('waitingList');
    const pausedListEl = document.getElementById('pausedList');
    const finishedListEl = document.getElementById('finishedList');
    const statusInfoEl = document.getElementById('statusInfo');
    const pausedCountEl = document.getElementById('pausedCount');
    const finishedCountEl = document.getElementById('finishedCount');
    const btnTick = document.getElementById('btnTick');
    const btnToggleAuto = document.getElementById('btnToggleAuto');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnReset = document.getElementById('btnReset');
  
    function generateBlockColor() {
      const values = "0123456789ABCDEF";
      let color = '';
      for (let i = 0; i < 6; i++) color += values[Math.floor(Math.random() * values.length)];
      return '#' + color;
    }
  
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    function createProcess() {
      const burst = randomInt(4, 12);
      return { id: processCounter++, color: generateBlockColor(), burst, remaining: burst, createdAt: Date.now() };
    }
  
    function initWaitingFixed() {
      while (waitingQueue.length < CAP_WAIT) waitingQueue.push(createProcess());
    }
  
    function mountDesk() {
      if (waitingQueue.length === 0 && pausedQueue.length > 0) {
        while (waitingQueue.length < CAP_WAIT && pausedQueue.length > 0) {
          waitingQueue.push(pausedQueue.shift());
        }
      }
  
      while (desk.length < DESK_CAPACITY && waitingQueue.length > 0) {
        const p = waitingQueue.shift();
        desk.push(p);
      }
      updateUI();
    }
  
    function tickOnce() {
      for (let i = 0; i < desk.length; i++) {
        const p = desk[i];
        if (p.remaining > 0) p.remaining -= 1;
      }
  
      for (let i = desk.length - 1; i >= 0; i--) {
        if (desk[i].remaining <= 0) {
          const f = desk.splice(i, 1)[0];
          finishedQueue.unshift(f);
          if (finishedQueue.length > MAX_FINISHED_KEEP) finishedQueue.pop();
        }
      }
  
      mountDesk();
    }
  
    function arrivalProcess() {
      const newP = createProcess();
  
      if (waitingQueue.length < CAP_WAIT) {
        waitingQueue.push(newP);
      } else {
        waitingQueue.unshift(newP);
  
        if (desk.length > 0) {
          let idx = 0;
          let minRemaining = desk[0].remaining;
          for (let i = 1; i < desk.length; i++) {
            if (desk[i].remaining < minRemaining) {
              minRemaining = desk[i].remaining;
              idx = i;
            }
          }
          const evicted = desk.splice(idx, 1)[0];
          pausedQueue.push(evicted);
          const incoming = waitingQueue.shift();
          desk.push(incoming);
        }
  
        while (waitingQueue.length > CAP_WAIT) waitingQueue.pop();
      }
      updateUI();
    }
  
    function startArrivals() {
      stopArrivals();
      const ms = parseInt(document.getElementById('arrivalInterval').value, 10) || 2000;
      arrivalIntervalId = setInterval(arrivalProcess, ms);
    }
  
    function stopArrivals() {
      if (arrivalIntervalId) {
        clearInterval(arrivalIntervalId);
        arrivalIntervalId = null;
      }
    }
  
    function startTicks() {
      stopTicks();
      const ms = parseInt(document.getElementById('tickSpeed').value, 10) || 700;
      tickInterval = setInterval(() => tickOnce(), ms);
      btnToggleAuto.textContent = 'Parar Auto';
    }
  
    function stopTicks() {
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      btnToggleAuto.textContent = 'Iniciar Auto';
    }
  
    btnTick.addEventListener('click', () => tickOnce());
    btnGenerate.addEventListener('click', () => {
      const n = parseInt(document.getElementById('genCount').value, 10) || 3;
      for (let i = 0; i < n; i++) arrivalProcess();
    });
  
    btnReset.addEventListener('click', () => {
      stopTicks();
      stopArrivals();
      desk = [];
      waitingQueue = [];
      pausedQueue = [];
      finishedQueue = [];
      processCounter = 1;
      initWaitingFixed();
      mountDesk();
      updateUI();
    });
  
    btnToggleAuto.addEventListener('click', () => {
      if (tickInterval) {
        stopTicks();
        stopArrivals();
      } else {
        startTicks();
        startArrivals();
      }
    });
  
    document.getElementById('tickSpeed').addEventListener('change', () => {
      if (tickInterval) {
        stopTicks();
        startTicks();
      }
    });
  
    document.getElementById('arrivalInterval').addEventListener('change', () => {
      if (arrivalIntervalId) {
        stopArrivals();
        startArrivals();
      }
    });
  
    function updateUI() {
      deskGridEl.innerHTML = '';
      for (let i = 0; i < DESK_CAPACITY; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        const p = desk[i];
        if (p) {
          slot.style.background = p.color;
          const progressPercent = Math.round(((p.burst - p.remaining) / p.burst) * 100);
          slot.innerHTML = `
            <div class="idBadge">#${p.id}</div>
            <div class="remTime">${p.remaining}/${p.burst}</div>
            <div class="lbl">#${p.id}</div>
            <div class="progressWrap"><div class="progressBar" style="width:${progressPercent}%"></div></div>
          `;
        } else {
          slot.classList.add('empty');
          slot.textContent = 'vazio';
        }
        deskGridEl.appendChild(slot);
      }
  
      waitingListEl.innerHTML = '';
      for (let i = 0; i < waitingQueue.length; i++) {
        const q = waitingQueue[i];
        const item = document.createElement('div');
        item.className = 'qItem';
        item.style.background = q.color;
        item.textContent = `#${q.id}`;
        waitingListEl.appendChild(item);
      }
  
      for (let i = waitingQueue.length; i < CAP_WAIT; i++) {
        const empty = document.createElement('div');
        empty.className = 'qItem';
        empty.style.background = '#eef2f7';
        empty.style.color = '#666';
        empty.textContent = 'vazio';
        waitingListEl.appendChild(empty);
      }
  
      pausedListEl.innerHTML = '';
      for (let i = 0; i < pausedQueue.length; i++) {
        const p = pausedQueue[i];
        const item = document.createElement('div');
        item.className = 'qItem';
        item.style.background = p.color;
        item.innerHTML = `<div>#${p.id}</div>`;
        pausedListEl.appendChild(item);
      }
  
      finishedListEl.innerHTML = '';
      for (let i = 0; i < finishedQueue.length; i++) {
        const f = finishedQueue[i];
        const it = document.createElement('div');
        it.className = 'qItem';
        it.style.background = f.color;
        it.textContent = `#${f.id}`;
        finishedListEl.appendChild(it);
      }
  
      statusInfoEl.textContent = `Mesa: ${desk.length}/${DESK_CAPACITY} | Em espera: ${waitingQueue.length}/${CAP_WAIT} | Pausados: ${pausedQueue.length} | Finalizados: ${finishedQueue.length}`;
      pausedCountEl.textContent = pausedQueue.length;
      finishedCountEl.textContent = finishedQueue.length;
    }
  
    initWaitingFixed();
    mountDesk();
    updateUI();
  
    window.__sim = { desk, waitingQueue, pausedQueue, finishedQueue, arrivalProcess, tickOnce };
  })();