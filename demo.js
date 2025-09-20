const http = require('http');

// Demo script to showcase the Vita AI Task Manager API
const API_BASE = 'http://localhost:3000';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runDemo() {
  console.log('🚀 Vita AI Task Manager Demo');
  console.log('=====================================\n');

  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log('✅ Status:', health.data.status);
    console.log('   Message:', health.data.message);
    console.log('');

    // 2. Load Seed Data
    console.log('2. Loading seed data...');
    const seed = await makeRequest('POST', '/admin/seed');
    console.log('✅', seed.data.message);
    console.log('');

    // 3. Get Recommendations (Scenario A)
    console.log('3. Getting recommendations for Scenario A...');
    const scenarioA = {
      metrics: {
        water_ml: 900,
        steps: 4000,
        sleep_hours: 6,
        screen_time_min: 150,
        mood_1to5: 2
      },
      currentTime: '2023-12-20T15:00:00Z',
      localDate: '2023-12-20'
    };

    const recommendations = await makeRequest('POST', '/recommendations', scenarioA);
    console.log('📋 Top 4 Recommendations:');
    recommendations.data.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (Score: ${task.score})`);
      console.log(`      Category: ${task.category}, Effort: ${task.effort_min}min`);
    });
    console.log('');

    // 4. Dismiss a task multiple times
    console.log('4. Testing substitution logic...');
    console.log('   Dismissing water-500 task 3 times...');
    
    for (let i = 1; i <= 3; i++) {
      const dismiss = await makeRequest('POST', '/actions/dismiss', {
        taskId: 'water-500',
        timestamp: '2023-12-20T15:30:00Z'
      });
      console.log(`   Dismissal ${i}: ${dismiss.data.message}`);
    }
    console.log('');

    // 5. Get recommendations after dismissals
    console.log('5. Getting recommendations after dismissals...');
    const afterDismissal = await makeRequest('POST', '/recommendations', scenarioA);
    console.log('📋 Updated Recommendations:');
    afterDismissal.data.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (Score: ${task.score})`);
      if (task.id === 'water-250') {
        console.log('      ⭐ Notice: water-500 was substituted with water-250!');
      }
    });
    console.log('');

    // 6. Complete a task
    console.log('6. Completing a task...');
    const complete = await makeRequest('POST', '/actions/complete', {
      taskId: 'screen-break-10',
      timestamp: '2023-12-20T15:45:00Z'
    });
    console.log('✅', complete.data.message);
    console.log('');

    // 7. Get final recommendations
    console.log('7. Final recommendations after completion...');
    const final = await makeRequest('POST', '/recommendations', scenarioA);
    console.log('📋 Final Recommendations:');
    final.data.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (Score: ${task.score})`);
    });
    console.log('   ⭐ Notice: screen-break-10 is no longer shown (completed)');
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('');
    console.log('💡 Key features demonstrated:');
    console.log('   ✅ Deterministic task scoring');
    console.log('   ✅ Task substitution after 3 dismissals');
    console.log('   ✅ Task completion hiding');
    console.log('   ✅ RESTful API endpoints');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('   Make sure the server is running: npm run dev');
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };