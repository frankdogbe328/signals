// Supabase Helper Functions
// These functions replace localStorage operations with Supabase database operations

// Wait for Supabase to be available
function getSupabaseClient() {
    // Use the global client if available
    if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
        return window.supabaseClient;
    }
    
    // Try to initialize if Supabase library is loaded
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        // Check if config variables are available
        if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
            try {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
                    console.log('Supabase client initialized in helper function');
                    return window.supabaseClient;
                }
            } catch (err) {
                console.error('Error creating Supabase client in helper:', err);
            }
        }
    }
    
    console.warn('Supabase client not available - falling back to localStorage');
    return null;
}

// ========== USER OPERATIONS ==========

// Get user by username and password
async function getUserFromSupabase(username, password, role) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        // Use .maybeSingle() instead of .single() to handle 0 or 1 records
        // .single() throws 406 error if no record found
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('role', role)
            .maybeSingle(); // Returns null if no record, single object if found
        
        if (error) {
            console.error('Supabase query error:', error);
            return null;
        }
        
        if (!data) {
            // No user found with that username and role
            return null;
        }
        
        // Verify password (in production, use hashed passwords)
        if (data.password === password) {
            // Convert to format expected by app
            return {
                id: data.id,
                username: data.username,
                password: data.password,
                role: data.role,
                name: data.name,
                class: data.class,
                courses: data.courses || [],
                email: data.email || null // Include email
            };
        }
        return null;
    } catch (err) {
        console.error('Error getting user:', err);
        return null;
    }
}

// Get user by email and role
async function getUserByEmailFromSupabase(email, role) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', role)
            .maybeSingle();
        
        if (error) {
            console.error('Supabase query error (by email):', error);
            return null;
        }
        
        if (!data) {
            return null;
        }
        
        return {
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
            name: data.name,
            class: data.class,
            courses: data.courses || [],
            email: data.email || null
        };
    } catch (err) {
        console.error('Error getting user by email:', err);
        return null;
    }
}

// Create new user
async function createUserInSupabase(userData) {
    const client = getSupabaseClient();
    if (!client) {
        console.error('Supabase client not available');
        throw new Error('Supabase client not available');
    }
    
    // Validate and normalize role - must be 'lecturer' or 'student'
    let role = userData.role;
    console.log('Original role from userData:', userData.role, 'Type:', typeof userData.role);
    
    if (role !== 'lecturer' && role !== 'student') {
        console.error('Invalid role:', role, 'Type:', typeof role);
        throw new Error('Invalid role. Must be "lecturer" or "student"');
    }
    
    // Ensure role is a string (in case it's something else)
    role = String(role).trim().toLowerCase();
    
    // Final check
    if (role !== 'lecturer' && role !== 'student') {
        console.error('Invalid role after normalization:', role);
        throw new Error('Invalid role. Must be "lecturer" or "student"');
    }
    
    console.log('Validated role to insert:', role);
    
    try {
        const insertData = {
            username: userData.username,
            password: userData.password,
            role: role, // Use validated role
            name: userData.name,
            class: userData.class || null,
            courses: userData.courses || [],
            email: userData.email || null // Include email
        };
        
        console.log('Inserting user data:', { ...insertData, password: '[HIDDEN]' });
        
        const { data, error } = await client
            .from('users')
            .insert([insertData])
            .select()
            .single();
        
        if (error) {
            console.error('Supabase error creating user:', error);
            // Throw error so caller knows it failed
            throw new Error(error.message || 'Failed to create user in database');
        }
        
        if (!data) {
            console.error('No data returned from Supabase insert');
            throw new Error('No data returned from database');
        }
        
        console.log('User successfully created in Supabase:', data.username);
        
        return {
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
            name: data.name,
            class: data.class,
            courses: data.courses || [],
            email: data.email || null
        };
    } catch (err) {
        console.error('Error creating user:', err);
        throw err; // Re-throw the error for handling in calling function
    }
}

// Update user
async function updateUserInSupabase(userId, updates) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating user:', error);
            return null;
        }
        
        return {
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
            name: data.name,
            class: data.class,
            courses: data.courses || [],
            email: data.email || null
        };
    } catch (err) {
        console.error('Error updating user:', err);
        return null;
    }
}

// Check if username exists
async function checkUsernameExists(username) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { data, error } = await client
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle(); // Use maybeSingle to avoid 406 if no record
        
        if (error) {
            console.error('Supabase check username error:', error);
            return false;
        }
        
        return data !== null;
    } catch (err) {
        console.error('Error checking username existence:', err);
        return false;
    }
}

// Get all users (for analytics)
async function getAllUsersFromSupabase() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        const { data, error } = await client
            .from('users')
            .select('*');
        
        if (error) {
            console.error('Error getting users:', error);
            return [];
        }
        
        return (data || []).map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role,
            name: u.name,
            class: u.class,
            courses: u.courses || [],
            email: u.email || null
        }));
    } catch (err) {
        console.error('Error getting all users:', err);
        return [];
    }
}

// ========== MATERIAL OPERATIONS ==========

// Get materials from Supabase
async function getMaterialsFromSupabase(filters = {}) {
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        let query = client.from('materials').select('*');
        
        // Apply filters
        if (filters.class) {
            query = query.eq('class', filters.class);
        }
        if (filters.course) {
            query = query.eq('course', filters.course);
        }
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        
        // Order by sequence, then uploaded_at
        query = query.order('sequence', { ascending: true })
                     .order('uploaded_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error getting materials:', error);
            return [];
        }
        
        // Convert to format expected by app
        return (data || []).map(m => ({
            id: m.id,
            course: m.course,
            class: m.class,
            title: m.title,
            type: m.type,
            content: m.content,
            description: m.description,
            category: m.category,
            sequence: m.sequence || 999,
            uploadedBy: m.uploaded_by,
            uploadedAt: m.uploaded_at,
            isFile: m.is_file || false,
            fileName: m.file_name,
            fileType: m.file_type,
            file_url: m.file_url // Include file URL from storage
        }));
    } catch (err) {
        console.error('Error getting materials:', err);
        return [];
    }
}

// Create material in Supabase
async function createMaterialInSupabase(materialData) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('materials')
            .insert([{
                course: materialData.course,
                class: materialData.class,
                title: materialData.title,
                type: materialData.type,
                content: materialData.content || null,
                description: materialData.description || null,
                category: materialData.category || null,
                sequence: materialData.sequence || 999,
                uploaded_by: materialData.uploadedBy,
                is_file: materialData.isFile || false,
                file_name: materialData.fileName || null,
                file_type: materialData.fileType || null,
                file_url: materialData.file_url || null // Store file URL from storage
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating material:', error);
            return null;
        }
        
        return {
            id: data.id,
            course: data.course,
            class: data.class,
            title: data.title,
            type: data.type,
            content: data.content,
            description: data.description,
            category: data.category,
            sequence: data.sequence,
            uploadedBy: data.uploaded_by,
            uploadedAt: data.uploaded_at,
            isFile: data.is_file,
            fileName: data.file_name,
            fileType: data.file_type,
            file_url: data.file_url
        };
    } catch (err) {
        console.error('Error creating material:', err);
        return null;
    }
}

// Update material in Supabase
async function updateMaterialInSupabase(materialId, materialData) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const updateData = {
            course: materialData.course,
            class: materialData.class,
            title: materialData.title,
            type: materialData.type,
            description: materialData.description || null,
            category: materialData.category || null,
            sequence: materialData.sequence || 999
        };
        
        // Only update content if provided
        if (materialData.content !== undefined) {
            updateData.content = materialData.content;
        }
        
        // Update file-related fields if provided
        if (materialData.fileName !== undefined) {
            updateData.file_name = materialData.fileName;
        }
        if (materialData.fileType !== undefined) {
            updateData.file_type = materialData.fileType;
        }
        if (materialData.file_url !== undefined) {
            updateData.file_url = materialData.file_url;
        }
        if (materialData.isFile !== undefined) {
            updateData.is_file = materialData.isFile;
        }
        
        const { error } = await client
            .from('materials')
            .update(updateData)
            .eq('id', materialId);
        
        if (error) {
            console.error('Error updating material:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error updating material:', err);
        return false;
    }
}

// Delete material
async function deleteMaterialFromSupabase(materialId) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        // First, get the material to check if it has a file in storage
        const { data: material, error: fetchError } = await client
            .from('materials')
            .select('file_url')
            .eq('id', materialId)
            .maybeSingle();
        
        if (!fetchError && material && material.file_url) {
            // Extract file path from URL and delete from storage
            try {
                const filePath = material.file_url.split('/').slice(-2).join('/'); // Get last two parts (bucket/path)
                await deleteSupabaseFile('learning-materials', filePath);
            } catch (storageError) {
                console.warn('Could not delete file from storage (file may not exist):', storageError);
            }
        }
        
        // Delete from database
        const { error } = await client
            .from('materials')
            .delete()
            .eq('id', materialId);
        
        if (error) {
            console.error('Error deleting material:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error deleting material:', err);
        return false;
    }
}

// ========== PROGRESS OPERATIONS ==========

// Get user progress
async function getUserProgressFromSupabase(userId) {
    const client = getSupabaseClient();
    if (!client) return {};
    
    try {
        const { data, error } = await client
            .from('progress')
            .select('material_id, completed')
            .eq('user_id', userId)
            .eq('completed', true);
        
        if (error) {
            console.error('Error getting progress:', error);
            return {};
        }
        
        const progress = {};
        data.forEach(p => {
            progress[p.material_id] = true;
        });
        
        return progress;
    } catch (err) {
        console.error('Error getting progress:', err);
        return {};
    }
}

// Mark material as completed
async function markMaterialCompletedInSupabase(userId, materialId) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { error } = await client
            .from('progress')
            .upsert({
                user_id: userId,
                material_id: materialId,
                completed: true,
                completed_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Error marking progress:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error marking progress:', err);
        return false;
    }
}

// Get all progress (for analytics)
async function getAllProgressFromSupabase() {
    const client = getSupabaseClient();
    if (!client) return {};
    
    try {
        const { data, error } = await client
            .from('progress')
            .select('user_id, material_id, completed')
            .eq('completed', true);
        
        if (error) {
            console.error('Error getting all progress:', error);
            return {};
        }
        
        const progress = {};
        data.forEach(p => {
            if (!progress[p.user_id]) {
                progress[p.user_id] = {};
            }
            progress[p.user_id][p.material_id] = true;
        });
        
        return progress;
    } catch (err) {
        console.error('Error getting all progress:', err);
        return {};
    }
}

// Delete progress for a material (when material is deleted)
async function deleteProgressForMaterial(materialId) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { error } = await client
            .from('progress')
            .delete()
            .eq('material_id', materialId);
        
        if (error) {
            console.error('Error deleting progress:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error deleting progress:', err);
        return false;
    }
}

// ========== SUPABASE STORAGE OPERATIONS ==========

// Upload file to Supabase Storage
async function uploadSupabaseFile(file, fileName, folder = 'learning-materials') {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not available');
    }
    
    try {
        // Generate unique file name to avoid conflicts
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
        const filePath = `${folder}/${uniqueFileName}`;
        
        // Upload file to storage
        const { data, error } = await client.storage
            .from(folder)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false // Don't overwrite existing files
            });
        
        if (error) {
            console.error('Error uploading file to storage:', error);
            throw new Error(error.message || 'Failed to upload file to storage');
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = client.storage
            .from(folder)
            .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to get file URL from storage');
        }
        
        return {
            path: filePath,
            url: urlData.publicUrl,
            fileName: sanitizedFileName // Return sanitized name
        };
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
}

// Get public URL for a file in Supabase Storage
function getSupabaseFileUrl(filePath, bucket = 'learning-materials') {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data } = client.storage
            .from(bucket)
            .getPublicUrl(filePath);
        
        return data?.publicUrl || null;
    } catch (err) {
        console.error('Error getting file URL:', err);
        return null;
    }
}

// Delete file from Supabase Storage
async function deleteSupabaseFile(bucket = 'learning-materials', filePath) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { error } = await client.storage
            .from(bucket)
            .remove([filePath]);
        
        if (error) {
            console.error('Error deleting file from storage:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error deleting file:', err);
        return false;
    }
}
