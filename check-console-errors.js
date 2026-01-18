// ============================================
// CONSOLE ERROR CHECKER AND DIAGNOSTIC SCRIPT
// Paste this into your browser console (F12) to check for errors
// ============================================

console.log('🔍 Starting Console Diagnostic Check...\n');
console.log('='.repeat(60));

// Capture all console errors
const errors = [];
const warnings = [];
const originalError = console.error;
const originalWarn = console.warn;

// Override console.error to capture errors
console.error = function(...args) {
    errors.push({
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        stack: new Error().stack
    });
    originalError.apply(console, args);
};

// Override console.warn to capture warnings
console.warn = function(...args) {
    warnings.push({
        message: args.join(' '),
        timestamp: new Date().toISOString()
    });
    originalWarn.apply(console, args);
};

// Test 1: Check Supabase Connection
console.log('\n📡 Test 1: Supabase Connection');
try {
    const supabase = getSupabaseClient();
    if (supabase) {
        console.log('✅ Supabase client available');
        console.log('   Client type:', typeof supabase);
        console.log('   Has from method:', typeof supabase.from === 'function');
    } else {
        console.error('❌ Supabase client not available');
    }
} catch (err) {
    console.error('❌ Error checking Supabase:', err);
}

// Test 2: Check Admin User
console.log('\n👤 Test 2: Current User Check');
try {
    const currentUser = getCurrentUser();
    if (currentUser) {
        console.log('✅ Current user found:', {
            id: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            name: currentUser.name
        });
        
        // Check if user exists in database
        if (typeof getSupabaseClient === 'function') {
            const supabase = getSupabaseClient();
            if (supabase) {
                supabase.from('users')
                    .select('id, role')
                    .eq('id', currentUser.id)
                    .maybeSingle()
                    .then(({ data, error }) => {
                        if (error) {
                            console.warn('⚠️ Error checking user in database:', error);
                        } else if (data) {
                            console.log('✅ User exists in database');
                        } else {
                            console.error('❌ User NOT found in database (ID:', currentUser.id + ')');
                            console.log('   This is likely the cause of foreign key errors!');
                        }
                    });
            }
        }
    } else {
        console.warn('⚠️ No current user found');
    }
} catch (err) {
    console.error('❌ Error checking current user:', err);
}

// Test 3: Check Database Tables
console.log('\n🗄️ Test 3: Database Tables');
async function checkTables() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('❌ Cannot check tables - Supabase not available');
            return;
        }
        
        const tables = ['users', 'exams', 'exam_grades', 'materials', 'progress'];
        const results = {};
        
        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    results[table] = { exists: false, error: error.message };
                } else {
                    results[table] = { exists: true, count: count || 0 };
                }
            } catch (err) {
                results[table] = { exists: false, error: err.message };
            }
        }
        
        console.table(results);
    } catch (err) {
        console.error('❌ Error checking tables:', err);
    }
}
checkTables();

// Test 4: Check Admin Users in Database
console.log('\n👑 Test 4: Admin Users in Database');
async function checkAdminUsers() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('❌ Cannot check admin users - Supabase not available');
            return;
        }
        
        const { data: admins, error } = await supabase
            .from('users')
            .select('id, username, name, role')
            .eq('role', 'admin');
        
        if (error) {
            console.error('❌ Error fetching admin users:', error);
            if (error.code === '42703') {
                console.log('   ⚠️ This might mean the role column constraint doesn\'t allow "admin"');
            }
        } else {
            if (admins && admins.length > 0) {
                console.log('✅ Found', admins.length, 'admin user(s):');
                console.table(admins);
            } else {
                console.warn('⚠️ No admin users found in database');
                console.log('   This will cause foreign key errors when creating exams!');
                console.log('   Solution: Run lms/CREATE_ADMIN_USER_NOW.sql in Supabase');
            }
        }
    } catch (err) {
        console.error('❌ Error checking admin users:', err);
    }
}
checkAdminUsers();

// Test 5: Check Required Functions
console.log('\n🔧 Test 5: Required Functions');
const requiredFunctions = [
    'getSupabaseClient',
    'getCurrentUser',
    'getOrCreateManualExam',
    'findOrCreateAdminUser',
    'loadManualScoreStudents',
    'saveManualScore'
];

const functionStatus = {};
requiredFunctions.forEach(funcName => {
    const exists = typeof window[funcName] !== 'undefined' || typeof eval(funcName) !== 'undefined';
    functionStatus[funcName] = exists ? '✅ Available' : '❌ Missing';
});
console.table(functionStatus);

// Test 6: Check for Recent Errors
setTimeout(() => {
    console.log('\n📊 Test 6: Error Summary');
    console.log('='.repeat(60));
    
    if (errors.length > 0) {
        console.error(`❌ Found ${errors.length} error(s) in console:`);
        errors.forEach((err, index) => {
            console.error(`${index + 1}. ${err.message}`);
        });
    } else {
        console.log('✅ No errors captured');
    }
    
    if (warnings.length > 0) {
        console.warn(`⚠️ Found ${warnings.length} warning(s):`);
        warnings.forEach((warn, index) => {
            console.warn(`${index + 1}. ${warn.message}`);
        });
    }
    
    // Check for specific error patterns
    const foreignKeyErrors = errors.filter(e => 
        e.message.includes('23503') || 
        e.message.includes('foreign key') ||
        e.message.includes('lecturer_id')
    );
    
    if (foreignKeyErrors.length > 0) {
        console.error('\n🔴 FOREIGN KEY ERRORS DETECTED:');
        console.error('This means an admin user ID is being used that doesn\'t exist in the database.');
        console.error('Solution:');
        console.error('1. Run lms/CLEAR_ALL_DATA_FOR_TESTING.sql in Supabase');
        console.error('2. Or run lms/CREATE_ADMIN_USER_NOW.sql to create an admin user');
        console.error('3. Then refresh this page');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic check complete!');
    console.log('Check the results above for any issues.');
}, 2000);

// Export functions for manual testing
window.checkConsoleErrors = function() {
    console.log('Errors:', errors);
    console.log('Warnings:', warnings);
    return { errors, warnings };
};

window.testAdminUserCreation = async function() {
    console.log('Testing admin user creation...');
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabase not available');
        return;
    }
    
    const adminId = await findOrCreateAdminUser(supabase);
    if (adminId) {
        console.log('✅ Admin user ID:', adminId);
    } else {
        console.error('❌ Failed to get/create admin user');
    }
    return adminId;
};

console.log('\n💡 Quick Test Commands:');
console.log('  - checkConsoleErrors() - View all captured errors');
console.log('  - testAdminUserCreation() - Test admin user creation');
console.log('\n');
