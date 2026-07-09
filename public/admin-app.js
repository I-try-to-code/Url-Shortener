document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Custom URL Form
    const customShortenForm = document.getElementById('custom-shorten-form');
    const longUrlInput = document.getElementById('long-url-input');
    const customCodeInput = document.getElementById('custom-code-input');
    const domainPrefix = document.getElementById('domain-prefix');
    const submitBtn = document.getElementById('submit-btn');
    const resultContainer = document.getElementById('result-container');
    const shortenedUrl = document.getElementById('shortened-url');
    const copyBtn = document.getElementById('copy-btn');
    const errorContainer = document.getElementById('error-container');
    const errorDescMsg = document.getElementById('error-desc-msg');

    // DOM Elements - Inventory & Search
    const searchInput = document.getElementById('search-input');
    const inventoryList = document.getElementById('inventory-list');
    const noResults = document.getElementById('no-results');

    // DOM Elements - Edit Modal
    const editModal = document.getElementById('edit-modal');
    const editLinkForm = document.getElementById('edit-link-form');
    const editCodeHidden = document.getElementById('edit-code-hidden');
    const editCodeLabel = document.getElementById('edit-code-label');
    const editLongUrlInput = document.getElementById('edit-long-url-input');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // DOM Elements - Mascot
    const adminRobot = document.getElementById('admin-robot');
    const robotScreenIcon = document.getElementById('robot-screen-icon');

    // State
    let activeLinks = [];

    // Initialize App
    init();

    function init() {
        // Fetch baseURL dynamically from the server config
        fetch('/api/url/admin/base-url')
            .then(res => res.json())
            .then(data => {
                if (data && data.baseURL) {
                    domainPrefix.textContent = data.baseURL + '/';
                } else {
                    domainPrefix.textContent = window.location.origin + '/';
                }
            })
            .catch(() => {
                domainPrefix.textContent = window.location.origin + '/';
            });

        loadLinksDatabase();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Form Submission (Create/Overwrite Custom Link)
        customShortenForm.addEventListener('submit', handleCustomShorten);

        // Reset mascot on form typing
        longUrlInput.addEventListener('input', () => setRobotState('idle'));
        customCodeInput.addEventListener('input', () => {
            setRobotState('idle');
            // Clean custom code inputs (strip spaces, lowercase)
            customCodeInput.value = customCodeInput.value.replace(/\s+/g, '-').toLowerCase();
        });

        // Copy button action
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(shortenedUrl.textContent, copyBtn);
        });

        // Search database filter
        searchInput.addEventListener('input', filterDatabase);

        // Edit Modal controls
        closeModalBtn.addEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);
        editLinkForm.addEventListener('submit', handleSaveEdit);
        editLongUrlInput.addEventListener('input', () => setRobotState('idle'));

        // Close modal on overlay click
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
    }

    // Mascot State Controller
    function setRobotState(state) {
        if (!adminRobot) return;
        adminRobot.classList.remove('state-loading', 'state-success', 'state-error');

        if (robotScreenIcon) {
            robotScreenIcon.className = 'fa-solid fa-user-lock screen-icon';
        }

        if (state === 'loading') {
            adminRobot.classList.add('state-loading');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-cog screen-icon';
            }
        } else if (state === 'success') {
            adminRobot.classList.add('state-success');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-check screen-icon';
            }
        } else if (state === 'error') {
            adminRobot.classList.add('state-error');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-circle-exclamation screen-icon';
            }
        }
    }

    // URL Validation Helper
    function isValidUrl(string) {
        try {
            const url = new URL(string.trim());
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    // Fetch Link database
    async function loadLinksDatabase() {
        try {
            const response = await fetch('/api/url/admin/links');
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.reload(); // re-prompt login if session lost
                    return;
                }
                throw new Error('Failed to load links');
            }
            activeLinks = await response.json();
            renderLinksTable(activeLinks);
        } catch (err) {
            console.error('Error fetching database:', err);
            inventoryList.innerHTML = `
                <tr>
                    <td colspan="4" class="table-loading" style="color: var(--error-color)">
                        <i class="fa-solid fa-triangle-exclamation"></i> Error loading link inventory database.
                    </td>
                </tr>
            `;
        }
    }

    // Render Table data
    function renderLinksTable(links) {
        if (links.length === 0) {
            inventoryList.innerHTML = `
                <tr>
                    <td colspan="4" class="table-loading">
                        <i class="fa-regular fa-folder-open"></i> No custom redirects created yet.
                    </td>
                </tr>
            `;
            return;
        }

        inventoryList.innerHTML = '';
        noResults.classList.add('hidden');

        links.forEach(item => {
            const tr = document.createElement('tr');

            // Format Date
            const createdDate = new Date(item.date);
            const dateString = createdDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Display links nicely
            const fullShortUrl = item.shortUrl;

            tr.innerHTML = `
                <td class="td-code">${item.urlCode}</td>
                <td class="td-url">
                    <a href="${item.longUrl}" target="_blank" rel="noopener noreferrer" title="${item.longUrl}">
                        ${item.longUrl}
                    </a>
                </td>
                <td class="td-date">${dateString}</td>
                <td class="actions-col">
                    <div class="history-actions">
                        <button class="btn-icon btn-copy" title="Copy Short URL">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <button class="btn-icon btn-edit" title="Edit Redirect Target">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Delete Short URL">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;

            // Wire up actions
            const itemCopyBtn = tr.querySelector('.btn-copy');
            itemCopyBtn.addEventListener('click', () => {
                copyTextToClipboard(item.shortUrl, itemCopyBtn);
            });
            tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(item));
            tr.querySelector('.btn-delete').addEventListener('click', () => handleDeleteLink(item.urlCode));

            inventoryList.appendChild(tr);
        });
    }

    // Form Submission: Create Custom URL
    async function handleCustomShorten(e) {
        e.preventDefault();

        const longUrl = longUrlInput.value.trim();
        const customCode = customCodeInput.value.trim().toLowerCase();

        // UI Reset
        errorContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');

        if (!longUrl || !customCode) return;

        // Code Format Check
        const codeRegex = /^[a-zA-Z0-9-_]+$/;
        if (!codeRegex.test(customCode)) {
            showError('Invalid custom code. Only letters, numbers, hyphens, and underscores are allowed.');
            return;
        }

        // Destination URL Check
        if (!isValidUrl(longUrl)) {
            showError('error 404, link not found');
            return;
        }

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        setRobotState('loading');

        try {
            const response = await fetch('/api/url/admin/custom-shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ longUrl, customCode })
            });

            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Creation request failed');
            }

            const data = await response.json();
            if (data && data.shortUrl) {
                shortenedUrl.textContent = data.shortUrl;
                shortenedUrl.href = data.shortUrl;
                resultContainer.classList.remove('hidden');
                setRobotState('success');

                // Clear input
                customCodeInput.value = '';
                longUrlInput.value = '';

                // Reload Database list
                loadLinksDatabase();
            } else {
                showError('error 404, link not found');
            }
        } catch (err) {
            console.error(err);
            showError(err.message || 'Server error occurred while creating custom redirect.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    function showError(msg) {
        errorDescMsg.textContent = msg === 'error 404, link not found'
            ? 'Please verify the destination URL starts with http:// or https://'
            : msg;

        // Ensure error title displays matching format
        const errorTitle = errorContainer.querySelector('.error-title');
        if (msg === 'error 404, link not found') {
            errorTitle.textContent = 'error 404, link not found';
        } else {
            errorTitle.textContent = 'invalid configuration';
        }

        errorContainer.classList.remove('hidden');
        setRobotState('error');
    }

    // Modal Control: Open
    function openEditModal(urlItem) {
        editCodeHidden.value = urlItem.urlCode;
        editCodeLabel.textContent = urlItem.urlCode;
        editLongUrlInput.value = urlItem.longUrl;

        editModal.classList.remove('hidden');
        editLongUrlInput.focus();
        setRobotState('idle');
    }

    // Modal Control: Close
    function closeEditModal() {
        editModal.classList.add('hidden');
        editLinkForm.reset();
    }

    // Save Edit Destination Link
    async function handleSaveEdit(e) {
        e.preventDefault();

        const code = editCodeHidden.value;
        const newLongUrl = editLongUrlInput.value.trim();

        if (!code || !newLongUrl) return;

        if (!isValidUrl(newLongUrl)) {
            alert('Please enter a valid destination URL starting with http:// or https://');
            setRobotState('error');
            return;
        }

        setRobotState('loading');

        try {
            const response = await fetch(`/api/url/admin/links/${code}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ longUrl: newLongUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to update link target URL');
            }

            closeEditModal();
            setRobotState('success');
            loadLinksDatabase();
        } catch (err) {
            console.error(err);
            alert('Failed to update destination link: ' + err.message);
            setRobotState('error');
        }
    }

    // Delete custom short code link
    async function handleDeleteLink(code) {
        if (!confirm(`Are you sure you want to delete the redirect code "${code}"?\nThis cannot be undone and the code will become available again.`)) {
            return;
        }

        setRobotState('loading');

        try {
            const response = await fetch(`/api/url/admin/links/${code}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete link');
            }

            setRobotState('success');
            loadLinksDatabase();
        } catch (err) {
            console.error(err);
            alert('Error deleting link: ' + err.message);
            setRobotState('error');
        }
    }

    // Search input filter
    function filterDatabase() {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
            renderLinksTable(activeLinks);
            return;
        }

        const filtered = activeLinks.filter(item =>
            item.urlCode.toLowerCase().includes(query) ||
            item.longUrl.toLowerCase().includes(query)
        );

        renderLinksTable(filtered);

        if (filtered.length === 0) {
            inventoryList.innerHTML = '';
            noResults.classList.remove('hidden');
        }
    }

    // Clipboard copier
    function copyTextToClipboard(text, btnElement) {
        if (!navigator.clipboard) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess(btnElement);
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(btnElement);
        }, (err) => {
            console.error('Copy failed', err);
        });
    }

    function setCopySuccess(btnElement) {
        const originalContent = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-check" style="color: var(--success-color)"></i> <span style="color: var(--success-color)">Copied!</span>`;
        btnElement.style.borderColor = 'var(--success-border)';
        btnElement.style.backgroundColor = 'var(--success-bg)';

        setTimeout(() => {
            btnElement.innerHTML = originalContent;
            btnElement.style.borderColor = '';
            btnElement.style.backgroundColor = '';
        }, 2000);
    }
});
