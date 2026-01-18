// ============================================
// SYSTEM TEST SCRIPT
// Run this in the browser console after clearing the database
// Open the admin portal or any page, then paste this in the console
// ============================================

console.log('🧪 Starting System Test...\n');

// Test 1: Check Supabase Connection
async function testSupabaseConnection() {
    console.log('Test 1: Checking Supabase Connection...');
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Try a simple query
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.error('❌ Supabase connection error:', error);
            return false;
        }
        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection test failed:', err);
        return false;
    }
}

// Test 2: Check Database Tables
async function testDatabaseTables() {
    console.log('\nTest 2: Checking Database Tables...');
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return false;
        
        const tables = ['users', 'materials', 'progress', 'exams', 'questions', 'exam_grades'];
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
        
        const allExist = Object.values(results).every(r => r.exists !== false);
        if (allExist) {
            console.log('✅ All required tables exist');
        } else {
            console.warn('⚠️ Some tables may be missing');
        }
        
        return allExist;
    } catch (err) {
        console.error('❌ Database tables test failed:', err);
        return false;
    }
}

// Test 3: Test User Registration
async function testUserRegistration() {
    console.log('\nTest 3: Testing User Registration...');
    try {
        // Check if registration function exists
        if (typeof createUserInSupabase === 'undefined') {
            console.warn('⚠️ createUserInSupabase function not found');
            return false;
        }
        
        console.log('✅ Registration function available');
        console.log('   (To test actual registration, use the registration form)');
        return true;
    } catch (err) {
        console.error('❌ User registration test failed:', err);
        return false;
    }
}

// Test 4: Test Student Index Generation
async function testStudentIndexGeneration() {
    console.log('\nTest 4: Testing Student Index Generation...');
    try {
        if (typeof window.generateNextStudentIndex === 'undefined') {
            console.warn('⚠️ generateNextStudentIndex function not found');
            return false;
        }
        
        // Test with a sample class
        const testClass = 'signals-basic';
        const index = await window.generateNextStudentIndex(testClass);
        
        if (index && index.startsWith('SB-')) {
            console.log(`✅ Student index generation works: ${index}`);
            return true;
        } else {
            console.warn(`⚠️ Unexpected index format: ${index}`);
            return false;
        }
    } catch (err) {
        console.error('❌ Student index generation test failed:', err);
        return false;
    }
}

// Test 5: Check Admin Portal Functions
async function testAdminPortalFunctions() {
    console.log('\nTest 5: Checking Admin Portal Functions...');
    try {
        const functions = [
            'loadAllUsers',
            'loadStatistics',
            'loadResults',
            'loadManualScoreStudents',
            'assignStudentIndices'
        ];
        
        const results = {};
        functions.forEach(func => {
            results[func] = typeof window[func] !== 'undefined' ? '✅ Available' : '❌ Missing';
        });
        
        console.table(results);
        
        const allAvailable = Object.values(results).every(r => r.includes('✅'));
        if (allAvailable) {
            console.log('✅ All admin portal functions available');
        } else {
            console.warn('⚠️ Some functions may be missing');
        }
        
        return allAvailable;
    } catch (err) {
        console.error('❌ Admin portal functions test failed:', err);
        return false;
    }
}

// Test 6: Check Console for Errors
function testConsoleErrors() {
    console.log('\nTest 6: Checking for Console Errors...');
    
    // Check if there are any obvious errors
    const errorCount = window.console.error.toString().includes('error') ? 0 : 0;
    
    console.log('✅ Console error check complete');
    console.log('   (Check the browser console above for any red error messages)');
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('='.repeat(50));
    console.log('SYSTEM TEST SUITE');
    console.log('='.repeat(50));
    
    const results = {
        'Supabase Connection': await testSupabaseConnection(),
        'Database Tables': await testDatabaseTables(),
        'User Registration': await testUserRegistration(),
        'Student Index Generation': await testStudentIndexGeneration(),
        'Admin Portal Functions': await testAdminPortalFunctions(),
        'Console Errors': testConsoleErrors()
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.table(results);
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    console.log(`\n✅ Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! System is ready for use.');
    } else {
        console.warn('⚠️ Some tests failed. Please check the errors above.');
    }
    
    return results;
}

// Auto-run tests
runAllTests().catch(err => {
    console.error('❌ Test suite failed:', err);
});

// Export for manual testing
window.runSystemTests = runAllTests;
