// Modal message system - replaces alert() with beautiful modals

// Show modal message
function showModal(title, message, type = 'info') {
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalButton = document.getElementById('modalButton');
    const modalClose = document.querySelector('.modal-close');
    
    if (!modal) return;
    
    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set icon based on type
    modalIcon.className = 'modal-icon';
    if (type === 'success') {
        modalIcon.textContent = '✅';
        modalIcon.classList.add('success');
    } else if (type === 'error') {
        modalIcon.textContent = '❌';
        modalIcon.classList.add('error');
    } else {
        modalIcon.textContent = 'ℹ️';
        modalIcon.classList.add('info');
    }
    
    // Show modal
    modal.classList.add('show');
    
    // Close handlers
    const closeModal = () => {
        modal.classList.remove('show');
    };
    
    modalButton.onclick = closeModal;
    modalClose.onclick = closeModal;
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Convenience functions
function showSuccess(message, title = 'Success') {
    showModal(title, message, 'success');
}

function showError(message, title = 'Error') {
    showModal(title, message, 'error');
}

function showInfo(message, title = 'Information') {
    showModal(title, message, 'info');
}

// Replace alert() globally (optional - can be used instead of alert)
window.showModal = showModal;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;

