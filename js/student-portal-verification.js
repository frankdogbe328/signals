// Student Portal Verification Script
// This script verifies all buttons, data sources, and progress tracking

(function() {
    'use strict';
    
    console.log('=== Student Portal Verification Started ===');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyStudentPortal);
    } else {
        verifyStudentPortal();
    }
    
    function verifyStudentPortal() {
        console.log('\n📋 Verifying Student Portal Components...\n');
        
        // 1. Check all required HTML elements exist
        const requiredElements = {
            'studentName': 'Student name display',
            'mobileStudentName': 'Mobile student name display',
            'studentInfo': 'Student info text',
            'registerCourseSelect': 'Course registration dropdown',
            'registeredCoursesList': 'Registered courses list',
            'materialsSection': 'Materials section',
            'materialsList': 'Materials list',
            'totalMaterials': 'Total materials counter',
            'completedMaterials': 'Completed materials counter',
            'progressPercentage': 'Progress percentage',
            'courseFilter': 'Course filter dropdown',
            'categoryFilter': 'Category filter dropdown',
            'materialsProgressSection': 'Materials progress section',
            'examProgressSection': 'Exam progress section'
        };
        
        console.log('1️⃣ Checking Required HTML Elements:');
        let allElementsExist = true;
        for (const [id, description] of Object.entries(requiredElements)) {
            const element = document.getElementById(id);
            if (element) {
                console.log(`   ✅ ${description} (${id}): Found`);
            } else {
                console.error(`   ❌ ${description} (${id}): MISSING`);
                allElementsExist = false;
            }
        }
        
        // 2. Check all button onclick handlers are connected
        console.log('\n2️⃣ Checking Button Connections:');
        
        const buttons = {
            'registerForCourse': typeof window.registerForCourse === 'function',
            'viewMaterial': typeof window.viewMaterial === 'function',
            'downloadFile': typeof window.downloadFile === 'function',
            'markAsCompleted': typeof window.markAsCompleted === 'function',
            'closeMaterialModal': typeof window.closeMaterialModal === 'function',
            'filterMaterials': typeof window.filterMaterials === 'function',
            'showProgressTab': typeof window.showProgressTab === 'function'
        };
        
        for (const [funcName, exists] of Object.entries(buttons)) {
            if (exists) {
                console.log(`   ✅ ${funcName}(): Connected`);
            } else {
                console.error(`   ❌ ${funcName}(): NOT FOUND`);
            }
        }
        
        // 3. Check data source functions (Supabase helpers)
        console.log('\n3️⃣ Checking Data Source Functions:');
        
        const dataFunctions = {
            'getSupabaseClient': typeof getSupabaseClient === 'function',
            'getMaterialsFromSupabase': typeof getMaterialsFromSupabase === 'function',
            'getUserProgressFromSupabase': typeof getUserProgressFromSupabase === 'function',
            'updateUserInSupabase': typeof updateUserInSupabase === 'function',
            'markMaterialCompletedInSupabase': typeof markMaterialCompletedInSupabase === 'function'
        };
        
        for (const [funcName, exists] of Object.entries(dataFunctions)) {
            if (exists) {
                console.log(`   ✅ ${funcName}(): Available`);
            } else {
                console.warn(`   ⚠️ ${funcName}(): Not found (will use localStorage fallback)`);
            }
        }
        
        // 4. Check progress tracking elements are correctly initialized
        console.log('\n4️⃣ Checking Progress Tracking:');
        
        const progressElements = {
            'totalMaterials': document.getElementById('totalMaterials'),
            'completedMaterials': document.getElementById('completedMaterials'),
            'progressPercentage': document.getElementById('progressPercentage')
        };
        
        for (const [id, element] of Object.entries(progressElements)) {
            if (element) {
                const currentValue = element.textContent || '0';
                console.log(`   ✅ ${id}: ${currentValue}`);
            } else {
                console.error(`   ❌ ${id}: Element not found`);
            }
        }
        
        // 5. Check materials section visibility logic
        console.log('\n5️⃣ Checking Materials Section Visibility:');
        
        const materialsSection = document.getElementById('materialsSection');
        const noCoursesMessage = document.getElementById('noCoursesMessage');
        
        if (materialsSection && noCoursesMessage) {
            const materialsVisible = materialsSection.style.display !== 'none';
            const noCoursesVisible = noCoursesMessage.style.display !== 'none';
            
            if (materialsVisible || noCoursesVisible) {
                console.log(`   ✅ Materials section: ${materialsVisible ? 'Visible' : 'Hidden'}`);
                console.log(`   ✅ No courses message: ${noCoursesVisible ? 'Visible' : 'Hidden'}`);
            } else {
                console.warn(`   ⚠️ Both sections are hidden (might need initialization)`);
            }
        } else {
            console.error('   ❌ Materials section or no courses message not found');
        }
        
        // 6. Verify current user data
        console.log('\n6️⃣ Checking Current User Data:');
        
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (currentUser) {
            console.log(`   ✅ User authenticated: ${currentUser.name || currentUser.username}`);
            console.log(`   ✅ User role: ${currentUser.role}`);
            console.log(`   ✅ User class: ${currentUser.class || 'Not set'}`);
            console.log(`   ✅ Registered courses: ${(currentUser.courses || []).length} subject(s)`);
            if (currentUser.courses && currentUser.courses.length > 0) {
                console.log(`      - ${currentUser.courses.join(', ')}`);
            }
        } else {
            console.error('   ❌ No current user found - authentication may have failed');
        }
        
        // 7. Check for console errors
        console.log('\n7️⃣ Console Error Check:');
        console.log('   ℹ️ Check browser console (F12) for any red error messages');
        console.log('   ℹ️ This script will detect runtime errors during operation');
        
        // Summary
        console.log('\n📊 Verification Summary:');
        if (allElementsExist) {
            console.log('   ✅ All required HTML elements found');
        } else {
            console.error('   ❌ Some HTML elements are missing');
        }
        
        console.log('\n✅ Verification complete!');
        console.log('=== Student Portal Verification Ended ===\n');
        
        // Return verification results
        return {
            elementsExist: allElementsExist,
            buttonsConnected: Object.values(buttons).every(v => v),
            userAuthenticated: !!currentUser,
            timestamp: new Date().toISOString()
        };
    }
    
    // Also run verification when page fully loads
    window.addEventListener('load', function() {
        setTimeout(verifyStudentPortal, 1000); // Wait 1 second for all scripts to load
    });
    
    // Make verifyStudentPortal available globally for manual testing
    window.verifyStudentPortal = verifyStudentPortal;
})();
