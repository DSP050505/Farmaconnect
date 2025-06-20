const fetch = require('node-fetch');

async function testPaymentIntent() {
  try {
    console.log('Testing payment intent creation...');
    
    const response = await fetch('http://localhost:5000/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 1,
        amount: 100,
        currency: 'inr'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Payment intent created successfully!');
      console.log('Client Secret:', data.clientSecret.substring(0, 20) + '...');
    } else {
      console.log('❌ Failed to create payment intent:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing payment intent:', error.message);
  }
}

testPaymentIntent(); 