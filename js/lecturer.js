// Update courses dropdown for lecturer based on selected class
function updateCoursesForLecturer() {
    const classSelect = document.getElementById('classSelect').value;
    const courseSelect = document.getElementById('courseSelect');
    
    if (!classSelect) {
        courseSelect.innerHTML = '<option value="">Select Class First</option>';
        courseSelect.disabled = true;
        return;
    }
    
    const courses = getCoursesForClass(classSelect);
    if (courses.length === 0) {
        courseSelect.innerHTML = '<option value="">No courses available for this class</option>';
        courseSelect.disabled = true;
    } else {
        courseSelect.innerHTML = '<option value="">Select Course</option>' +
            courses.map(course => `<option value="${course}">${course}</option>`).join('');
        courseSelect.disabled = false;
    }
}

// Lecturer dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Display lecturer name
    document.getElementById('lecturerName').textContent = currentUser.name;
    
    // Update mobile menu name
    const mobileLecturerName = document.getElementById('mobileLecturerName');
    if (mobileLecturerName) {
        mobileLecturerName.textContent = currentUser.name;
    }
    
    // Load materials
    loadMaterials();
    loadAnalytics();
    
    // Handle upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleMaterialUpload);
    }
});

function handleMaterialTypeChange() {
    const materialType = document.getElementById('materialType').value;
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const contentGroup = document.getElementById('contentGroup');
    const materialContent = document.getElementById('materialContent');
    const materialFile = document.getElementById('materialFile');
    
    if (materialType === 'file') {
        fileUploadGroup.style.display = 'block';
        contentGroup.style.display = 'none';
        materialContent.removeAttribute('required');
        materialFile.setAttribute('required', 'required');
    } else {
        fileUploadGroup.style.display = 'none';
        contentGroup.style.display = 'block';
        materialContent.setAttribute('required', 'required');
        materialFile.removeAttribute('required');
        materialFile.value = ''; // Clear file input
        document.getElementById('filePreview').innerHTML = '';
    }
}

function previewFile() {
    const fileInput = document.getElementById('materialFile');
    const previewDiv = document.getElementById('filePreview');
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
        
        if (file.size > 10 * 1024 * 1024) {
            previewDiv.innerHTML = '<p style="color: red;">⚠️ File size exceeds 10MB limit!</p>';
            fileInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileType = file.type || getFileTypeFromName(file.name);
            let previewHTML = `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 3px solid var(--primary-color);">
                    <strong>📎 ${file.name}</strong><br>
                    <small style="color: #666;">Size: ${fileSize} MB | Type: ${fileType}</small>
            `;
            
            // Preview for images
            if (fileType.startsWith('image/')) {
                previewHTML += `<br><img src="${e.target.result}" style="max-width: 200px; margin-top: 10px; border-radius: 5px;">`;
            }
            
            previewHTML += '</div>';
            previewDiv.innerHTML = previewHTML;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = '';
    }
}

function handleMaterialUpload(e) {
    e.preventDefault();
    
    const course = document.getElementById('courseSelect').value;
    const classSelect = document.getElementById('classSelect').value;
    const title = document.getElementById('materialTitle').value;
    const type = document.getElementById('materialType').value;
    const description = document.getElementById('materialDescription').value;
    const category = document.getElementById('materialCategory').value;
    const sequence = parseInt(document.getElementById('materialSequence').value) || 999;
    
    // Handle file upload
    const materialFile = document.getElementById('materialFile');
    let content = '';
    let fileName = '';
    let fileType = '';
    let fileData = null;
    
    if (type === 'file' && materialFile.files.length > 0) {
        const file = materialFile.files[0];
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit. Please choose a smaller file.');
            return;
        }
        
        fileName = file.name;
        fileType = file.type || getFileTypeFromName(fileName);
        
        // Read file as base64
        const reader = new FileReader();
        reader.onload = function(e) {
            fileData = e.target.result;
            saveMaterialWithFile(course, classSelect, title, type, description, category, sequence, fileData, fileName, fileType);
        };
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
        return; // Exit early, will continue in callback
    } else {
        content = document.getElementById('materialContent').value;
        if (!content && type !== 'file') {
            alert('Please provide content or upload a file');
            return;
        }
    }
    
    // Continue with normal upload (non-file)
    saveMaterial(course, classSelect, title, type, content, description, category, sequence);
}

function getFileTypeFromName(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    return typeMap[ext] || 'application/octet-stream';
}

async function saveMaterialWithFile(course, classSelect, title, type, description, category, sequence, fileData, fileName, fileType) {
    const currentUser = getCurrentUser();
    const editingId = document.getElementById('uploadForm').dataset.editingId;
    
    // For now, store file as base64 in content field
    // TODO: Upload to Supabase Storage and store URL
    const materialData = {
        course: course,
        class: classSelect,
        title: title,
        type: type,
        content: fileData, // Store base64 file data
        description: description,
        category: category,
        sequence: sequence,
        uploadedBy: currentUser.name,
        isFile: true,
        fileName: fileName,
        fileType: fileType
    };
    
    let success = false;
    
    // Try Supabase first
    if (typeof createMaterialInSupabase === 'function' && typeof updateMaterialInSupabase === 'function') {
        try {
            if (editingId) {
                success = await updateMaterialInSupabase(editingId, materialData);
                if (success) {
                    alert('Material updated successfully!');
                }
            } else {
                const created = await createMaterialInSupabase(materialData);
                if (created) {
                    success = true;
                    alert('File uploaded successfully!');
                }
            }
        } catch (err) {
            console.error('Supabase file save error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const newMaterial = {
            id: editingId || Date.now().toString(),
            ...materialData,
            uploadedAt: new Date().toISOString()
        };
        
        if (editingId) {
            const index = materials.findIndex(m => m.id === editingId);
            if (index !== -1) {
                materials[index] = { ...materials[index], ...newMaterial, id: editingId };
                localStorage.setItem('materials', JSON.stringify(materials));
                alert('Material updated successfully!');
            }
            delete document.getElementById('uploadForm').dataset.editingId;
            document.getElementById('submitBtn').textContent = 'Upload Material';
            document.getElementById('cancelBtn').style.display = 'none';
        } else {
            materials.push(newMaterial);
            localStorage.setItem('materials', JSON.stringify(materials));
            alert('File uploaded successfully!');
        }
    } else {
        // Clear editing state if Supabase succeeded
        if (editingId) {
            delete document.getElementById('uploadForm').dataset.editingId;
            document.getElementById('submitBtn').textContent = 'Upload Material';
            document.getElementById('cancelBtn').style.display = 'none';
        }
    }
    
    // Reset form
    document.getElementById('uploadForm').reset();
    document.getElementById('fileUploadGroup').style.display = 'none';
    document.getElementById('contentGroup').style.display = 'block';
    document.getElementById('filePreview').innerHTML = '';
    
    // Reload materials and analytics
    loadMaterials();
    if (document.getElementById('analyticsContent')) {
        loadAnalytics();
    }
}

async function saveMaterial(course, classSelect, title, type, content, description, category, sequence) {
    const currentUser = getCurrentUser();
    const editingId = document.getElementById('uploadForm').dataset.editingId;
    
    const materialData = {
        course: course,
        class: classSelect,
        title: title,
        type: type,
        content: content,
        description: description,
        category: category,
        sequence: sequence,
        uploadedBy: currentUser.name
    };
    
    let success = false;
    
    // Try Supabase first
    if (typeof createMaterialInSupabase === 'function' && typeof updateMaterialInSupabase === 'function') {
        try {
            if (editingId) {
                success = await updateMaterialInSupabase(editingId, materialData);
                if (success) {
                    alert('Material updated successfully!');
                }
            } else {
                const created = await createMaterialInSupabase(materialData);
                if (created) {
                    success = true;
                    alert('Material uploaded successfully!');
                }
            }
        } catch (err) {
            console.error('Supabase save error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const newMaterial = {
            id: editingId || Date.now().toString(),
            ...materialData,
            uploadedAt: new Date().toISOString()
        };
        
        if (editingId) {
            const index = materials.findIndex(m => m.id === editingId);
            if (index !== -1) {
                materials[index] = { ...materials[index], ...newMaterial, id: editingId };
                localStorage.setItem('materials', JSON.stringify(materials));
                alert('Material updated successfully!');
            }
        } else {
            materials.push(newMaterial);
            localStorage.setItem('materials', JSON.stringify(materials));
            alert('Material uploaded successfully!');
        }
    }
    
    // Clear editing state
    if (editingId) {
        delete document.getElementById('uploadForm').dataset.editingId;
        document.getElementById('submitBtn').textContent = 'Upload Material';
        document.getElementById('cancelBtn').style.display = 'none';
    }
    
    // Reset form
    document.getElementById('uploadForm').reset();
    
    // Reload materials and analytics
    loadMaterials();
    if (document.getElementById('analyticsContent')) {
        loadAnalytics();
    }
}

function loadAnalytics() {
    const materials = JSON.parse(localStorage.getItem('materials') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    
    const officers = users.filter(u => u.role === 'officer');
    const activeClasses = [...new Set(materials.map(m => m.class))];
    
    // Calculate overall completion rate
    let totalCompletions = 0;
    let totalPossible = 0;
    
    officers.forEach(officer => {
        const officerMaterials = materials.filter(m => 
            m.class === officer.class && m.course === officer.course
        );
        totalPossible += officerMaterials.length;
        const officerProgress = progress[officer.id] || {};
        totalCompletions += officerMaterials.filter(m => officerProgress[m.id]).length;
    });
    
    const overallCompletion = totalPossible > 0 
        ? Math.round((totalCompletions / totalPossible) * 100) 
        : 0;
    
    // Update overview
    document.getElementById('totalMaterialsCount').textContent = materials.length;
    document.getElementById('totalOfficersCount').textContent = officers.length;
    document.getElementById('overallCompletion').textContent = overallCompletion + '%';
    document.getElementById('activeClassesCount').textContent = activeClasses.length;
    
    // Load class progress
    loadClassProgress(materials, officers, progress);
    
    // Load material statistics
    loadMaterialStats(materials, officers, progress);
}

function loadClassProgress(materials, officers, progress) {
    const classProgressContent = document.getElementById('classProgressContent');
    const classes = [
        'signal-basic-beginner', 'signal-basic-ii-intermediate', 'signal-basic-i-advanced',
        'regimental-basic-beginner', 'regimental-basic-ii-intermediate', 'regimental-basic-i-advanced',
        'electronic-warfare',
        'upgrading-telecom', 'upgrading-rf',
        'drone-operators'
    ];
    
    let html = '<div class="class-progress-grid">';
    
    classes.forEach(classId => {
        const classMaterials = materials.filter(m => m.class === classId);
        const classOfficers = officers.filter(o => o.class === classId);
        
        if (classMaterials.length === 0 && classOfficers.length === 0) {
            html += `
                <div class="class-progress-card">
                    <h4>${formatClassName(classId)}</h4>
                    <p class="empty-state">No materials or officers</p>
                </div>
            `;
            return;
        }
        
        let classCompletions = 0;
        let classTotal = 0;
        
        classOfficers.forEach(officer => {
            // Support both old format (course) and new format (courses array)
            const officerCourses = officer.courses || (officer.course ? [officer.course] : []);
            const officerMaterials = classMaterials.filter(m => officerCourses.includes(m.course));
            classTotal += officerMaterials.length;
            const officerProgress = progress[officer.id] || {};
            classCompletions += officerMaterials.filter(m => officerProgress[m.id]).length;
        });
        
        const classCompletionRate = classTotal > 0 
            ? Math.round((classCompletions / classTotal) * 100) 
            : 0;
        
        html += `
            <div class="class-progress-card">
                <h4>${formatClassName(classId)}</h4>
                <div class="progress-details">
                    <div class="progress-stat">
                        <span class="stat-label">Materials:</span>
                        <span class="stat-value">${classMaterials.length}</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Officers:</span>
                        <span class="stat-value">${classOfficers.length}</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Completion:</span>
                        <span class="stat-value">${classCompletionRate}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${classCompletionRate}%"></div>
                    </div>
                </div>
                <div class="officer-list" style="margin-top: 15px;">
                    <strong>Officer Progress:</strong>
                    ${classOfficers.length === 0 ? '<p class="empty-state">No officers in this class</p>' : ''}
                    ${classOfficers.map(officer => {
                        // Support both old format (course) and new format (courses array)
                        const officerCourses = officer.courses || (officer.course ? [officer.course] : []);
                        const officerMaterials = classMaterials.filter(m => officerCourses.includes(m.course));
                        const officerProgress = progress[officer.id] || {};
                        const completed = officerMaterials.filter(m => officerProgress[m.id]).length;
                        const total = officerMaterials.length;
                        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return `
                            <div class="officer-progress-item">
                                <span>${officer.name}</span>
                                <span>${completed}/${total} (${rate}%)</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    classProgressContent.innerHTML = html;
}

function loadMaterialStats(materials, officers, progress) {
    const materialStatsContent = document.getElementById('materialStatsContent');
    
    if (materials.length === 0) {
        materialStatsContent.innerHTML = '<p class="empty-state">No materials uploaded yet</p>';
        return;
    }
    
    // Calculate stats for each material
    const materialStats = materials.map(material => {
        // Support both old format (course) and new format (courses array)
        const relevantOfficers = officers.filter(o => 
            o.class === material.class && 
            (o.courses ? o.courses.includes(material.course) : (o.course === material.course))
        );
        
        let completed = 0;
        relevantOfficers.forEach(officer => {
            const officerProgress = progress[officer.id] || {};
            if (officerProgress[material.id]) {
                completed++;
            }
        });
        
        const completionRate = relevantOfficers.length > 0 
            ? Math.round((completed / relevantOfficers.length) * 100) 
            : 0;
        
        return {
            ...material,
            totalOfficers: relevantOfficers.length,
            completedOfficers: completed,
            completionRate: completionRate
        };
    });
    
    // Sort by completion rate (lowest first to see what needs attention)
    materialStats.sort((a, b) => a.completionRate - b.completionRate);
    
    let html = '<div class="material-stats-list">';
    materialStats.forEach(stat => {
        html += `
            <div class="material-stat-item">
                <div class="material-stat-header">
                    <div>
                        <strong>${stat.sequence ? `Module ${stat.sequence}: ` : ''}${stat.title}</strong>
                        <div class="material-stat-meta">
                            <span>${stat.class}</span>
                            ${stat.category ? `<span>📁 ${stat.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="material-stat-rate">${stat.completionRate}%</div>
                </div>
                <div class="progress-bar-container" style="margin-top: 10px;">
                    <div class="progress-bar" style="width: ${stat.completionRate}%"></div>
                </div>
                <div class="material-stat-footer">
                    <span>${stat.completedOfficers}/${stat.totalOfficers} officers completed</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    materialStatsContent.innerHTML = html;
}

function showAnalytics(tab) {
    // Hide all tabs
    document.querySelectorAll('.analytics-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    if (tab === 'overview') {
        document.getElementById('overviewTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tab === 'class-progress') {
        document.getElementById('classProgressTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    } else if (tab === 'material-stats') {
        document.getElementById('materialStatsTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
    }
    
    // Reload analytics data
    loadAnalytics();
}

async function loadMaterials() {
    const materialsList = document.getElementById('materialsList');
    const filterClass = document.getElementById('filterClass')?.value || 'all';
    const filterCategory = document.getElementById('filterCategory')?.value || 'all';
    
    // Try Supabase first, fallback to localStorage
    let materials = [];
    
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            const filters = {};
            if (filterClass !== 'all') filters.class = filterClass;
            if (filterCategory !== 'all') filters.category = filterCategory;
            materials = await getMaterialsFromSupabase(filters);
        } catch (err) {
            console.error('Supabase load error:', err);
        }
    }
    
    // Fallback to localStorage
    if (materials.length === 0) {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
        // Apply filters for localStorage
        if (filterClass !== 'all') {
            materials = materials.filter(m => m.class === filterClass);
        }
        if (filterCategory !== 'all') {
            materials = materials.filter(m => m.category === filterCategory);
        }
    }
    
    // Update category filter options (get all materials for filter)
    let allMaterials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            allMaterials = await getMaterialsFromSupabase({});
        } catch (err) {
            allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    updateCategoryFilter(allMaterials);
    
    if (materials.length === 0) {
        materialsList.innerHTML = '<p class="empty-state">No materials found</p>';
        return;
    }
    
    // Sort by sequence number, then by upload date
    filteredMaterials.sort((a, b) => {
        const seqA = a.sequence || 999;
        const seqB = b.sequence || 999;
        if (seqA !== seqB) return seqA - seqB;
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
    });
    
    materialsList.innerHTML = filteredMaterials.map(material => `
        <div class="material-item">
            <div class="material-header">
                <div>
                    <div class="material-title">
                        ${material.sequence ? `<span style="color: #666; font-weight: normal;">Module ${material.sequence}: </span>` : ''}
                        ${material.title}
                    </div>
                    <div class="material-meta">
                        <span>📚 ${material.course}</span>
                        <span>👥 ${material.class}</span>
                        ${material.category ? `<span>📁 ${material.category}</span>` : ''}
                        ${material.isFile ? `<span>📎 ${material.fileName || 'File'}</span>` : ''}
                        <span>📅 ${formatDate(material.uploadedAt)}</span>
                        <span class="badge badge-${material.type}">${material.isFile ? 'FILE' : material.type.toUpperCase()}</span>
                    </div>
                </div>
            </div>
            ${material.description ? `<div class="material-description">${material.description}</div>` : ''}
            <div class="material-description">
                <strong>Uploaded by:</strong> ${material.uploadedBy}
            </div>
            <div class="material-actions">
                <button onclick="window.editMaterial('${material.id}')" class="btn btn-secondary">Edit</button>
                <button onclick="window.deleteMaterial('${material.id}')" class="btn btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateCategoryFilter(materials) {
    const categoryFilter = document.getElementById('filterCategory');
    if (!categoryFilter) return;
    
    const categories = [...new Set(materials.map(m => m.category).filter(c => c))];
    const currentValue = categoryFilter.value;
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    if (currentValue && categories.includes(currentValue)) {
        categoryFilter.value = currentValue;
    }
}

// Make functions globally accessible
window.editMaterial = async function(materialId) {
    // Try Supabase first, fallback to localStorage
    let materials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            materials = await getMaterialsFromSupabase({});
        } catch (err) {
            materials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    const material = materials.find(m => m.id === materialId);
    
    if (!material) {
        alert('Material not found');
        return;
    }
    
    // Populate form with material data
    document.getElementById('courseSelect').value = material.course;
    document.getElementById('classSelect').value = material.class;
    document.getElementById('materialTitle').value = material.title;
    document.getElementById('materialType').value = material.type;
    
    // Handle file vs content
    if (material.isFile) {
        handleMaterialTypeChange();
        // Note: File editing not fully supported - would need to re-upload
        document.getElementById('materialContent').value = '';
        alert('Note: File materials cannot be edited. Please delete and re-upload if changes are needed.');
    } else {
        document.getElementById('materialContent').value = material.content;
    }
    
    document.getElementById('materialDescription').value = material.description || '';
    document.getElementById('materialCategory').value = material.category || '';
    document.getElementById('materialSequence').value = material.sequence || '';
    
    // Store editing material ID
    document.getElementById('uploadForm').dataset.editingId = materialId;
    
    // Change button text and show cancel button
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    submitBtn.textContent = 'Update Material';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEdit = function() {

    // Reset form
    document.getElementById('uploadForm').reset();
    
    // Clear editing state
    delete document.getElementById('uploadForm').dataset.editingId;
    
    // Reset button text and hide cancel button
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    submitBtn.textContent = 'Upload Material';
    cancelBtn.style.display = 'none';
};

window.deleteMaterial = async function(materialId) {
    if (!confirm('Are you sure you want to delete this material?')) {
        return;
    }
    
    let success = false;
    
    // Try Supabase first
    if (typeof deleteMaterialFromSupabase === 'function' && typeof deleteProgressForMaterial === 'function') {
        try {
            // Delete progress first (foreign key constraint)
            await deleteProgressForMaterial(materialId);
            success = await deleteMaterialFromSupabase(materialId);
        } catch (err) {
            console.error('Supabase delete error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const filteredMaterials = materials.filter(m => m.id !== materialId);
        localStorage.setItem('materials', JSON.stringify(filteredMaterials));
        
        // Also remove from progress tracking
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        Object.keys(progress).forEach(officerId => {
            if (progress[officerId][materialId]) {
                delete progress[officerId][materialId];
            }
        });
        localStorage.setItem('progress', JSON.stringify(progress));
    }
    
    loadMaterials();
    if (document.getElementById('analyticsContent')) {
        loadAnalytics();
    }
};

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatClassName(classId) {
    const classNames = {
        'signal-basic-beginner': 'Signal Basic - Beginner',
        'signal-basic-ii-intermediate': 'Signal Basic II - Intermediate',
        'signal-basic-i-advanced': 'Signal Basic I - Advanced',
        'regimental-basic-beginner': 'Regimental Basic - Beginner',
        'regimental-basic-ii-intermediate': 'Regimental Basic II - Intermediate',
        'regimental-basic-i-advanced': 'Regimental Basic I - Advanced',
        'electronic-warfare': 'Electronic Warfare',
        'upgrading-telecom': 'Upgrading - Telecom',
        'upgrading-rf': 'Upgrading - RF',
        'drone-operators': 'Practical Drone Operators Course'
    };
    return classNames[classId] || classId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

