import React from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="py-10 animate-fade-in max-w-4xl mx-auto min-h-[70vh]">
            <div className="flex items-center justify-between mb-8">
                <div className="text-2xl sm:text-3xl">
                    <Title text1="PRIVACY" text2="POLICY" />
                </div>
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all active:scale-95 border border-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Go Back
                </button>
            </div>

            <div className="space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
                <section className="bg-gray-50/50 border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">1. Information We Collect</h3>
                    <p>
                        We collect information to provide better services to all our users. When you use our services, we may collect personal information such as your name, email address, phone number, and delivery address. We also collect non-personal data like browser type, IP address, and browsing behavior to improve our website experience.
                    </p>
                </section>

                <section className="bg-gray-50/50 border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">2. How We Use Your Information</h3>
                    <p>
                        The information we collect is used to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>Process your orders and manage your account.</li>
                        <li>Deliver the products and services you request.</li>
                        <li>Send you important updates, order confirmations, and promotional offers (if you opt-in).</li>
                        <li>Improve our store layout, product offerings, and customer service.</li>
                    </ul>
                </section>

                <section className="bg-gray-50/50 border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">3. Data Security</h3>
                    <p>
                        We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. We use state-of-the-art encryption to protect sensitive data transmitted online and restrict offline access strictly to authorized personnel.
                    </p>
                </section>

                <section className="bg-gray-50/50 border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">4. Sharing Your Information</h3>
                    <p>
                        We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
                    </p>
                </section>

                <section className="bg-gray-50/50 border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">5. Your Consent</h3>
                    <p>
                        By using our site, you consent to our website's privacy policy. If we decide to change our privacy policy, we will post those changes on this page.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
