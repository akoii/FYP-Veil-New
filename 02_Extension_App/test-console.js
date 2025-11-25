// Quick Console Test Script for Cookie Loading
// Run this in the browser console when dashboard.html is open

console.log('=== VEIL COOKIE LOADING TEST ===\n');

// Test 1: Check if CookieManager is loaded
console.log('1️⃣ Testing CookieManager module...');
if (typeof window.CookieManager !== 'undefined') {
  console.log('✅ CookieManager is loaded');
  console.log('   Available methods:', Object.keys(window.CookieManager));
} else {
  console.error('❌ CookieManager is NOT loaded!');
}

// Test 2: Check Chrome APIs
console.log('\n2️⃣ Testing Chrome API access...');
if (typeof chrome !== 'undefined' && chrome.cookies) {
  console.log('✅ chrome.cookies API is available');
} else {
  console.error('❌ chrome.cookies API is NOT available');
}

if (typeof chrome !== 'undefined' && chrome.tabs) {
  console.log('✅ chrome.tabs API is available');
} else {
  console.error('❌ chrome.tabs API is NOT available');
}

// Test 3: Check DOM elements
console.log('\n3️⃣ Testing DOM elements...');
const elements = {
  'adCookiesContainer': document.getElementById('adCookiesContainer'),
  'adCookiesCount': document.getElementById('adCookiesCount'),
  'cookieViewToggle': document.getElementById('cookieViewToggle'),
  'cookieSearchInput': document.getElementById('cookieSearchInput'),
  'refreshCookiesBtn': document.getElementById('refreshCookiesBtn')
};

Object.entries(elements).forEach(([name, element]) => {
  if (element) {
    console.log(`✅ ${name} found`);
  } else {
    console.error(`❌ ${name} NOT found`);
  }
});

// Test 4: Try fetching cookies
console.log('\n4️⃣ Attempting to fetch cookies...');
if (window.CookieManager && chrome.cookies) {
  window.CookieManager.fetchAllCookies()
    .then(cookies => {
      console.log(`✅ Successfully fetched ${cookies.length} cookies`);
      if (cookies.length > 0) {
        console.log('   Sample domains:', cookies.slice(0, 5).map(c => c.domain));
        console.log('   Sample cookie:', window.CookieManager.formatCookie(cookies[0]));
      } else {
        console.warn('⚠️ No cookies found. Visit some websites first!');
      }
    })
    .catch(error => {
      console.error('❌ Error fetching cookies:', error);
    });
} else {
  console.error('❌ Cannot test cookie fetching - prerequisites not met');
}

// Test 5: Check global state
console.log('\n5️⃣ Checking global cookie state...');
setTimeout(() => {
  if (typeof allCookies !== 'undefined') {
    console.log(`✅ allCookies array exists with ${allCookies.length} cookies`);
  } else {
    console.warn('⚠️ allCookies global variable not found');
  }
  
  if (typeof displayedCookies !== 'undefined') {
    console.log(`✅ displayedCookies array exists with ${displayedCookies.length} cookies`);
  } else {
    console.warn('⚠️ displayedCookies global variable not found');
  }
}, 1000);

console.log('\n=== TEST COMPLETE ===');
console.log('Check the results above. All ✅ means everything is working!');
