// DOM Elements
const notesList = document.getElementById('notes-list');
const notesCounter = document.getElementById('notes-counter');
const editorContainer = document.getElementById('editor-container');
const emptyState = document.getElementById('empty-state');
const editorTextarea = document.getElementById('editor-textarea');
const previewContainer = document.getElementById('preview-container');
const previewContent = document.getElementById('preview-content');
const noteTitleInput = document.getElementById('note-title-input');
const wordCountDisplay = document.getElementById('word-count-display');
const lastSavedDisplay = document.getElementById('last-saved-display');
const searchInput = document.getElementById('search-input');
const sidebar = document.querySelector('.sidebar');
const mobileOverlay = document.querySelector('.mobile-overlay');

// Modals
const addNoteModal = document.getElementById('add-note-modal');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const settingsModal = document.getElementById('settings-modal');
const modalNoteTitle = document.getElementById('modal-note-title');
const modalNoteCategory = document.getElementById('modal-note-category');
const modalNoteTags = document.getElementById('modal-note-tags');
const tagsContainer = document.getElementById('tags-container');

// Buttons
const addNoteBtn = document.getElementById('add-note-btn');
const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const editModeBtn = document.getElementById('edit-mode-btn');
const previewModeBtn = document.getElementById('preview-mode-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const settingsBtn = document.getElementById('settings-btn');
const mobileToggleBtn = document.getElementById('mobile-toggle');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const saveModalBtn = document.getElementById('save-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const closeSettingsModalBtn = document.getElementById('close-settings-modal');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const exportAllBtn = document.getElementById('export-all-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// Formatting buttons
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const h1Btn = document.getElementById('h1-btn');
const h2Btn = document.getElementById('h2-btn');
const h3Btn = document.getElementById('h3-btn');
const ulBtn = document.getElementById('ul-btn');
const olBtn = document.getElementById('ol-btn');
const taskBtn = document.getElementById('task-btn');
const codeBtn = document.getElementById('code-btn');
const linkBtn = document.getElementById('link-btn');

// App state
let notes = [];
let currentNoteId = null;
let autoSaveInterval = null;
let settings = {
    autoSave: 'off',
    fontSize: 'medium',
    exportFormat: 'markdown'
};

// Initialize app
function init() {
    loadNotes();
    loadSettings();
    applySettings();
    updateNotesList();
    addEventListeners();
    checkEmptyState();
}

// Load notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('devnotes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('devnotes_settings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

// Apply settings to the UI
function applySettings() {
    // Set font size for editor
    if (settings.fontSize === 'small') {
        editorTextarea.style.fontSize = '14px';
    } else if (settings.fontSize === 'medium') {
        editorTextarea.style.fontSize = '16px';
    } else if (settings.fontSize === 'large') {
        editorTextarea.style.fontSize = '18px';
    }

    // Set values in settings form
    document.getElementById('auto-save').value = settings.autoSave;
    document.getElementById('font-size').value = settings.fontSize;
    document.getElementById('export-format').value = settings.exportFormat;

    // Setup auto-save if enabled
    setupAutoSave();
}

// Setup auto-save interval
function setupAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }

    if (settings.autoSave !== 'off') {
        const interval = parseInt(settings.autoSave);
        autoSaveInterval = setInterval(() => {
            if (currentNoteId) {
                saveCurrentNote();
                showToast('Note auto-saved', 'Your changes have been automatically saved', 'success');
            }
        }, interval);
    }
}

// Update the notes list in the sidebar
function updateNotesList() {
    notesList.innerHTML = '';
    notesCounter.textContent = notes.length;

    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = searchTerm 
        ? notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            note.content.toLowerCase().includes(searchTerm) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm))))
        : notes;

    filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    filteredNotes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = `note-item${note.id === currentNoteId ? ' active' : ''}`;
        noteItem.dataset.id = note.id;

        const preview = note.content.length > 100 
            ? note.content.substring(0, 100) + '...' 
            : note.content;

        noteItem.innerHTML = `
            <div class="note-item-title">${note.title || 'Untitled Note'}</div>
            <div class="note-item-preview">${preview}</div>
            <div class="note-item-meta">
                <span>${formatDate(note.updatedAt)}</span>
                <span class="note-item-category">${note.category || 'general'}</span>
            </div>
        `;

        noteItem.addEventListener('click', () => {
            loadNote(note.id);
        });

        notesList.appendChild(noteItem);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Check if there are notes and show/hide empty state
function checkEmptyState() {
    if (notes.length === 0) {
        editorContainer.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        if (!currentNoteId && notes.length > 0) {
            loadNote(notes[0].id);
        }
    }
}

// Load a note into the editor
function loadNote(id) {
    const note = notes.find(note => note.id === id);
    if (!note) return;

    currentNoteId = id;
    noteTitleInput.value = note.title || '';
    editorTextarea.value = note.content || '';
    updateWordCount();
    lastSavedDisplay.textContent = `Last saved: ${formatDate(note.updatedAt)}`;
    
    // Show editor, hide empty state
    editorContainer.style.display = 'flex';
    emptyState.style.display = 'none';
    
    // Update active state in list
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });

    // Update preview if in preview mode
    if (previewContainer.style.display === 'block') {
        renderPreview();
    }
}

// Create a new note
function createNewNote(data = {}) {
    const newNote = {
        id: generateId(),
        title: data.title || 'Untitled Note',
        content: data.content || '',
        category: data.category || 'general',
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    saveNotes();
    updateNotesList();
    loadNote(newNote.id);
    
    return newNote;
}

// Save the current note
function saveCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex(note => note.id === currentNoteId);
    if (noteIndex === -1) return;

    notes[noteIndex].title = noteTitleInput.value;
    notes[noteIndex].content = editorTextarea.value;
    notes[noteIndex].updatedAt = new Date().toISOString();

    saveNotes();
    updateNotesList();
    lastSavedDisplay.textContent = `Last saved: Just now`;

    return notes[noteIndex];
}

// Delete the current note
function deleteCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex(note => note.id === currentNoteId);
    if (noteIndex === -1) return;

    notes.splice(noteIndex, 1);
    saveNotes();
    updateNotesList();
    
    if (notes.length > 0) {
        loadNote(notes[0].id);
    } else {
        currentNoteId = null;
        checkEmptyState();
    }
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem('devnotes', JSON.stringify(notes));
}

// Save settings to localStorage
function saveAppSettings() {
    localStorage.setItem('devnotes_settings', JSON.stringify(settings));
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Update word and character count
function updateWordCount() {
    const text = editorTextarea.value;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;
    wordCountDisplay.textContent = `${wordCount} words, ${charCount} characters`;
}

// Render markdown preview
function renderPreview() {
    const markdown = editorTextarea.value;
    // Simple markdown to HTML conversion
    let html = markdown
        // Headers
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\s*\- (.*$)/gm, '<ul><li>$1</li></ul>')
        .replace(/^\s*\d+\. (.*$)/gm, '<ol><li>$1</li></ol>')
        // Task lists
        .replace(/^\s*\[ \] (.*$)/gm, '<div class="task"><input type="checkbox" disabled> $1</div>')
        .replace(/^\s*\[x\] (.*$)/gm, '<div class="task"><input type="checkbox" checked disabled> $1</div>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Blockquotes
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    // Fix nested lists
    html = html.replace(/<\/ul>\s*<br><ul>/g, '');
    html = html.replace(/<\/ol>\s*<br><ol>/g, '');
    
    previewContent.innerHTML = html;
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="close-toast">&times;</button>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    toast.querySelector('.close-toast').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Export note to file
function exportNote(note) {
    const format = settings.exportFormat;
    let content = '';
    let mimeType = '';
    let extension = '';
    
    if (format === 'markdown') {
        content = `# ${note.title}\n\n${note.content}`;
        mimeType = 'text/markdown';
        extension = 'md';
    } else if (format === 'text') {
        content = `${note.title}\n\n${note.content}`;
        mimeType = 'text/plain';
        extension = 'txt';
    } else if (format === 'html') {
        content = `<!DOCTYPE html>
<html>
<head>
<title>${note.title}</title>
</head>
<body>
<h1>${note.title}</h1>
${renderPreview(note.content)}
</body>
</html>`;
        mimeType = 'text/html';
        extension = 'html';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'untitled'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
}

// Clear all data after confirmation
function clearAllData() {
    localStorage.removeItem('devnotes');
    localStorage.removeItem('devnotes_settings');
    notes = [];
    currentNoteId = null;
    settings = {
        autoSave: 'off',
        fontSize: 'medium',
        exportFormat: 'markdown'
    };
    loadSettings();
    applySettings();
    updateNotesList();
    checkEmptyState();
    showToast('Data cleared', 'All notes and settings have been cleared', 'info');
}

// Insert text at cursor position in textarea
function insertAtCursor(textarea, text) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    
    textarea.value = textarea.value.substring(0, startPos) + text + textarea.value.substring(endPos);
    textarea.selectionStart = startPos + text.length;
    textarea.selectionEnd = startPos + text.length;
    textarea.scrollTop = scrollTop;
    textarea.focus();
}

// Wrap selected text with formatting
function wrapText(textarea, before, after) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = textarea.value.substring(startPos, endPos);
    const scrollTop = textarea.scrollTop;
    
    textarea.value = textarea.value.substring(0, startPos) + 
                    before + selectedText + after + 
                    textarea.value.substring(endPos);
    
    // Set cursor position after the insertion
    const newPos = endPos + before.length + after.length;
    textarea.selectionStart = startPos + before.length;
    textarea.selectionEnd = startPos + before.length + selectedText.length;
    textarea.scrollTop = scrollTop;
    textarea.focus();
}

// Add event listeners
function addEventListeners() {
    // Toggle sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        toggleSidebarBtn.innerHTML = sidebar.classList.contains('sidebar-collapsed') 
            ? '<span>▶</span>' 
            : '<span>◀</span><span class="toggle-sidebar-text">Collapse sidebar</span>';
    });

    // Mobile sidebar toggle
    mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
        mobileOverlay.classList.add('show');
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        mobileOverlay.classList.remove('show');
    });

    // Search functionality
    searchInput.addEventListener('input', () => {
        updateNotesList();
    });

    // Editor events
    editorTextarea.addEventListener('input', () => {
        updateWordCount();
        if (previewContainer.style.display === 'block') {
            renderPreview();
        }
    });

    // Create new note
    addNoteBtn.addEventListener('click', () => {
        modalNoteTitle.value = '';
        modalNoteCategory.value = 'general';
        modalNoteTags.value = '';
        tagsContainer.innerHTML = '';
        saveModalBtn.textContent = 'Create Note';
        addNoteModal.style.display = 'flex';
    });

    emptyStateAddBtn.addEventListener('click', () => {
        addNoteBtn.click();
    });

    // Save note
    saveBtn.addEventListener('click', () => {
        const savedNote = saveCurrentNote();
        if (savedNote) {
            showToast('Note saved', 'Your changes have been saved', 'success');
        }
    });

    // Delete note
    deleteBtn.addEventListener('click', () => {
        deleteConfirmModal.style.display = 'flex';
    });

    // Toggle edit/preview mode
    editModeBtn.addEventListener('click', () => {
        editorTextarea.style.display = 'block';
        previewContainer.style.display = 'none';
        editModeBtn.classList.add('active');
        previewModeBtn.classList.remove('active');
    });

    previewModeBtn.addEventListener('click', () => {
        editorTextarea.style.display = 'none';
        previewContainer.style.display = 'block';
        previewModeBtn.classList.add('active');
        editModeBtn.classList.remove('active');
        renderPreview();
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    // Modal close events
    closeModalBtn.addEventListener('click', () => {
        addNoteModal.style.display = 'none';
    });

    cancelModalBtn.addEventListener('click', () => {
        addNoteModal.style.display = 'none';
    });

    closeDeleteModalBtn.addEventListener('click', () => {
        deleteConfirmModal.style.display = 'none';
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteConfirmModal.style.display = 'none';
    });

    closeSettingsModalBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Confirm delete
    confirmDeleteBtn.addEventListener('click', () => {
        deleteCurrentNote();
        deleteConfirmModal.style.display = 'none';
        showToast('Note deleted', 'The note has been permanently deleted', 'success');
    });

    // Save new note from modal
    saveModalBtn.addEventListener('click', () => {
        const title = modalNoteTitle.value;
        const category = modalNoteCategory.value;
        
        // Collect tags from container
        const tags = [];
        document.querySelectorAll('.tag').forEach(tag => {
            tags.push(tag.dataset.value);
        });
        
        createNewNote({ title, category, tags });
        addNoteModal.style.display = 'none';
        showToast('Note created', 'Your new note has been created', 'success');
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        settings.autoSave = document.getElementById('auto-save').value;
        settings.fontSize = document.getElementById('font-size').value;
        settings.exportFormat = document.getElementById('export-format').value;
        
        saveAppSettings();
        applySettings();
        settingsModal.style.display = 'none';
        showToast('Settings saved', 'Your settings have been updated', 'success');
    });

    // Export all notes
    exportAllBtn.addEventListener('click', () => {
        if (notes.length === 0) {
            showToast('No notes to export', 'Create some notes first', 'warning');
            return;
        }
        
        notes.forEach(note => {
            exportNote(note);
        });
        
        showToast('Notes exported', `${notes.length} notes have been exported`, 'success');
    });

    // Clear all data
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all notes and settings? This cannot be undone.')) {
            clearAllData();
        }
    });

    // Tags input handling
    modalNoteTags.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tagValue = modalNoteTags.value.trim();
            if (tagValue) {
                addTag(tagValue);
                modalNoteTags.value = '';
            }
        }
    });

    // Text formatting buttons
    boldBtn.addEventListener('click', () => {
        wrapText(editorTextarea, '**', '**');
    });

    italicBtn.addEventListener('click', () => {
        wrapText(editorTextarea, '*', '*');
    });

    h1Btn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            // If not at the beginning of a line, insert newline first
            insertAtCursor(editorTextarea, '\n# ');
        } else {
            insertAtCursor(editorTextarea, '# ');
        }
    });

    h2Btn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            insertAtCursor(editorTextarea, '\n## ');
        } else {
            insertAtCursor(editorTextarea, '## ');
        }
    });

    h3Btn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            insertAtCursor(editorTextarea, '\n### ');
        } else {
            insertAtCursor(editorTextarea, '### ');
        }
    });

    ulBtn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            insertAtCursor(editorTextarea, '\n- ');
        } else {
            insertAtCursor(editorTextarea, '- ');
        }
    });

    olBtn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            insertAtCursor(editorTextarea, '\n1. ');
        } else {
            insertAtCursor(editorTextarea, '1. ');
        }
    });

    taskBtn.addEventListener('click', () => {
        const startPos = editorTextarea.selectionStart;
        const beforeText = editorTextarea.value.substring(0, startPos);
        const lineStart = beforeText.lastIndexOf('\n') + 1 || 0;
        
        if (startPos - lineStart > 0) {
            insertAtCursor(editorTextarea, '\n[ ] ');
        } else {
            insertAtCursor(editorTextarea, '[ ] ');
        }
    });

    codeBtn.addEventListener('click', () => {
        wrapText(editorTextarea, '```\n', '\n```');
    });

    linkBtn.addEventListener('click', () => {
        wrapText(editorTextarea, '[', '](https://)');
    });

    // Tag click event
    tagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.target.remove();
        }
    });
}

// Add a tag to the tags container
function addTag(value) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.dataset.value = value;
    tag.textContent = value;
    tagsContainer.appendChild(tag);
}

// Initialize app
init();