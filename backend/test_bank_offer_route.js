import axios from 'axios';

async function testBankOfferRoute() {
    try {
        console.log('Testing GET http://localhost:4000/api/bank-offer/list ...');
        const res = await axios.get('http://localhost:4000/api/bank-offer/list?adminView=true');
        console.log('Response Status:', res.status);
        console.log('Response Data Success:', res.data.success);
        console.log('Offers Found:', res.data.offers?.length);
    } catch (err) {
        console.error('API Test Error:', err.response ? `${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message);
    }
}

testBankOfferRoute();
