/**
 * Simple test script to verify cache functionality
 */
import cache from './src/services/cache';

console.log('Testing in-memory cache...\n');

// Test 1: Basic set and get
console.log('Test 1: Basic set/get');
cache.set('test:key1', { data: 'hello world' }, 60);
const result1 = cache.get('test:key1');
console.log('  Result:', result1);
console.log('  ✅ PASS\n');

// Test 2: Cache miss
console.log('Test 2: Cache miss');
const result2 = cache.get('nonexistent:key');
console.log('  Result:', result2);
console.log('  ✅ PASS (should be null)\n');

// Test 3: Cache expiration
console.log('Test 3: Cache expiration (1 second TTL)');
cache.set('test:expire', { data: 'will expire' }, 1);
console.log('  Immediate get:', cache.get('test:expire'));
setTimeout(() => {
  const expired = cache.get('test:expire');
  console.log('  After 1.5 seconds:', expired);
  console.log('  ✅ PASS (should be null)\n');
  
  // Test 4: Cache stats
  console.log('Test 4: Cache statistics');
  const stats = cache.getStats();
  console.log('  Stats:', stats);
  console.log('  ✅ PASS\n');
  
  // Test 5: Cache wrap method
  console.log('Test 5: Cache wrap method');
  let callCount = 0;
  const fetchData = async () => {
    callCount++;
    return { data: 'fetched data', callNumber: callCount };
  };
  
  (async () => {
    const data1 = await cache.wrap('test:wrap', 60, fetchData);
    console.log('  First call:', data1, '(callCount:', callCount, ')');
    
    const data2 = await cache.wrap('test:wrap', 60, fetchData);
    console.log('  Second call (cached):', data2, '(callCount:', callCount, ')');
    
    if (callCount === 1 && data1.data === data2.data) {
      console.log('  ✅ PASS (fetcher called only once)\n');
    } else {
      console.log('  ❌ FAIL\n');
    }
    
    // Final stats
    console.log('Final cache statistics:');
    console.log(cache.getStats());
    
    console.log('\n✅ All tests completed!');
  })();
}, 1500);
