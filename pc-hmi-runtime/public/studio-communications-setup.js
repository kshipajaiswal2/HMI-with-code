/** Communications Setup — PLC connection via IP address */
(function () {
  function isValidIpv4(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const n = Number(part);
      return n >= 0 && n <= 255;
    });
  }

  function syncCommSetupFields() {
    const driver = document.getElementById('commDriver')?.value || 'simulator';
    const ipEl = document.getElementById('commPlcIp');
    const pathEl = document.getElementById('commPath');
    const pathRow = document.getElementById('commPathRow');
    const ipHint = document.getElementById('commIpHint');
    const needsIp = driver !== 'simulator';
    const ip = ipEl?.value.trim() || '';

    if (pathRow) pathRow.classList.toggle('hidden', driver !== 'ethernet-ip');
    if (pathEl) pathEl.disabled = driver !== 'ethernet-ip';
    if (ipEl) {
      ipEl.required = needsIp;
      ipEl.placeholder = needsIp ? '192.168.1.10' : '192.168.1.10 (optional — used when not in simulator mode)';
    }
    if (ipHint) {
      ipHint.textContent = needsIp
        ? 'Enter the PLC Ethernet/IP address on your plant network.'
        : 'Simulator mode ignores the IP. Switch driver to EtherNet/IP or OPC UA to connect to a live PLC.';
    }
    const testBtn = document.getElementById('commTestConnection');
    if (testBtn) {
      testBtn.disabled = !needsIp || !isValidIpv4(ip);
    }
  }

  function setCommStatus(message, ok) {
    const el = document.getElementById('commStatus');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('comm-status-ok', ok === true);
    el.classList.toggle('comm-status-error', ok === false);
  }

  async function showCommunicationsSetupDialog() {
    if (!window.state?.activeProject) {
      window.setStatus('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    const cfg = window.state.projectConfig?.communication || {};
    document.getElementById('communicationsSetupTitle').textContent =
      `Communications Setup - /${window.state.activeProject}/`;
    document.getElementById('commDriver').value = cfg.driver || 'simulator';
    document.getElementById('commPlcIp').value = cfg.plcIpAddress || '';
    document.getElementById('commPath').value = cfg.path ?? '0';
    document.getElementById('commPoll').value = cfg.pollIntervalMs ?? 200;
    document.getElementById('commReconnect').value = cfg.reconnectIntervalMs ?? 5000;
    syncCommSetupFields();
    setCommStatus('', null);
    document.getElementById('communicationsSetupDialog')?.showModal();
  }

  function readCommunicationsSetupForm() {
    const driver = document.getElementById('commDriver').value;
    const plcIpAddress = document.getElementById('commPlcIp').value.trim();
    const communication = {
      ...(window.state.projectConfig?.communication || {}),
      driver,
      plcIpAddress: driver === 'simulator' ? plcIpAddress : plcIpAddress,
      path: document.getElementById('commPath').value.trim() || '0',
      pollIntervalMs: Number(document.getElementById('commPoll').value) || 200,
      reconnectIntervalMs: Number(document.getElementById('commReconnect').value) || 5000
    };
    if (driver === 'opcua') {
      communication.opcua = {
        ...(communication.opcua || {}),
        port: communication.opcua?.port || 4840,
        securityMode: communication.opcua?.securityMode || 'None',
        securityPolicy: communication.opcua?.securityPolicy || 'None'
      };
    }
    return communication;
  }

  function validateCommunicationsSetup(communication) {
    if (communication.driver === 'simulator') return true;
    if (!communication.plcIpAddress) {
      window.setStatus('Enter the PLC IP address');
      setCommStatus('PLC IP address is required.', false);
      return false;
    }
    if (!isValidIpv4(communication.plcIpAddress)) {
      window.setStatus('Invalid PLC IP address');
      setCommStatus('Enter a valid IPv4 address (for example 192.168.1.10).', false);
      return false;
    }
    return true;
  }

  async function saveCommunicationsSetup(closeAfter) {
    const communication = readCommunicationsSetupForm();
    if (!validateCommunicationsSetup(communication)) return false;
    await window.fetchJson(`/api/projects/${window.state.activeProject}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communication })
    });
    await window.refreshProjectConfig?.();
    const ipNote = communication.driver === 'simulator'
      ? 'Simulator (offline)'
      : communication.plcIpAddress;
    window.setStatus(`Communications saved — ${communication.driver}${ipNote ? ` @ ${ipNote}` : ''}`);
    if (closeAfter) document.getElementById('communicationsSetupDialog')?.close();
    return true;
  }

  async function testConnection() {
    const communication = readCommunicationsSetupForm();
    if (!validateCommunicationsSetup(communication)) return;
    setCommStatus('Testing connection…', null);
    try {
      const result = await window.fetchJson('/api/runtime/communication/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: window.state.activeProject,
          driver: communication.driver,
          plcIpAddress: communication.plcIpAddress,
          path: communication.path
        })
      });
      if (result.ok) {
        setCommStatus(`Connected to ${communication.plcIpAddress}`, true);
        window.setStatus(`PLC reachable at ${communication.plcIpAddress}`);
      } else {
        setCommStatus(result.error || 'Connection failed', false);
        window.setStatus(result.error || 'PLC connection test failed');
      }
    } catch (err) {
      setCommStatus(err.message || 'Connection test failed', false);
      window.setStatus(`Error: ${err.message}`);
    }
  }

  function initCommunicationsSetupDialog() {
    const form = document.getElementById('communicationsSetupForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveCommunicationsSetup(true);
    });
    document.getElementById('cancelCommunicationsSetup')?.addEventListener('click', () => {
      document.getElementById('communicationsSetupDialog')?.close();
    });
    document.getElementById('applyCommunicationsSetup')?.addEventListener('click', async () => {
      await saveCommunicationsSetup(false);
    });
    document.getElementById('commDriver')?.addEventListener('change', syncCommSetupFields);
    document.getElementById('commPlcIp')?.addEventListener('input', syncCommSetupFields);
    document.getElementById('commTestConnection')?.addEventListener('click', () => {
      testConnection().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('helpCommunicationsSetup')?.addEventListener('click', () => {
      alert(
        'Configure the PLC connection using its IP address.\n\n'
        + 'Allen-Bradley ControlLogix / CompactLogix: EtherNet/IP on port 44818.\n'
        + 'OPC UA: server at opc.tcp://<IP>:4840.\n\n'
        + 'Use Simulator for offline development without a live PLC.'
      );
    });
  }

  window.StudioCommunicationsSetup = {
    initCommunicationsSetupDialog,
    showCommunicationsSetupDialog
  };
})();
