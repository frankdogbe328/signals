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
                email: data.email,
                class: data.class,
                courses: data.courses || []
            };
        }
        return null;
    } catch (err) {
        console.error('Error getting user:', err);
        return null;
    }
}

// Create new user
async function createUserInSupabase(userData) {
    const client = getSupabaseClient();
    if (!client) {
        console.error('Supabase client not available');
        return null;
    }
    
    try {
        const { data, error } = await client
            .from('users')
            .insert([{
                username: userData.username,
                password: userData.password,
                role: userData.role,
                name: userData.name,
                email: userData.email || null,
                class: userData.class || null,
                courses: userData.courses || []
            }])
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
            courses: data.courses || []
        };
    } catch (err) {
        console.error('Error creating user in Supabase:', err);
        // Re-throw so caller can handle it
        throw err;
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
            .limit(1)
            .maybeSingle(); // Use maybeSingle to avoid 406 error if username doesn't exist
        
        return data !== null && !error;
    } catch (err) {
        console.error('Error checking username:', err);
        return false;
    }
}

// Update user (for course registration, etc.)
async function updateUserInSupabase(userId, updates) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { error } = await client
            .from('users')
            .update(updates)
            .eq('id', userId);
        
        return !error;
    } catch (err) {
        console.error('Error updating user:', err);
        return false;
    }
}

// ========== MATERIAL OPERATIONS ==========

// Get all materials (with optional filters)
async function getMaterialsFromSupabase(filters = {}) {
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        let query = client.from('materials').select('*');
        
        if (filters.class) {
            query = query.eq('class', filters.class);
        }
        if (filters.course) {
            query = query.eq('course', filters.course);
        }
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        
        const { data, error } = await query.order('sequence', { ascending: true });
        
        if (error) {
            console.error('Error getting materials:', error);
            return [];
        }
        
        return data.map(m => ({
            id: m.id,
            course: m.course,
            class: m.class,
            title: m.title,
            type: m.type,
            content: m.content,
            description: m.description,
            category: m.category,
            sequence: m.sequence,
            uploadedBy: m.uploaded_by,
            uploadedAt: m.uploaded_at,
            isFile: m.is_file,
            fileName: m.file_name,
            fileType: m.file_type,
            fileUrl: m.file_url
        }));
    } catch (err) {
        console.error('Error getting materials:', err);
        return [];
    }
}

// Create material
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
                file_url: materialData.fileUrl || null
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
            fileUrl: data.file_url
        };
    } catch (err) {
        console.error('Error creating material:', err);
        return null;
    }
}

// Update material
async function updateMaterialInSupabase(materialId, updates) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const updateData = {};
        if (updates.course !== undefined) updateData.course = updates.course;
        if (updates.class !== undefined) updateData.class = updates.class;
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.type !== undefined) updateData.type = updates.type;
        if (updates.content !== undefined) updateData.content = updates.content;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.sequence !== undefined) updateData.sequence = updates.sequence;
        if (updates.fileName !== undefined) updateData.file_name = updates.fileName;
        if (updates.fileType !== undefined) updateData.file_type = updates.fileType;
        if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl;
        
        const { error } = await client
            .from('materials')
            .update(updateData)
            .eq('id', materialId);
        
        return !error;
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
        const { error } = await client
            .from('materials')
            .delete()
            .eq('id', materialId);
        
        return !error;
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
        
        return !error;
    } catch (err) {
        console.error('Error marking progress:', err);
        return false;
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
        
        return !error;
    } catch (err) {
        console.error('Error deleting progress:', err);
        return false;
    }
}

