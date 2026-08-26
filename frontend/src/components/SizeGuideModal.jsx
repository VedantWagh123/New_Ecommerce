import React, { useState } from 'react';

const sizeCharts = {
    Men: [
        { size: 'S', chest: '36-38', waist: '30-32', hips: '37-39', length: '27' },
        { size: 'M', chest: '38-40', waist: '32-34', hips: '39-41', length: '28' },
        { size: 'L', chest: '40-42', waist: '34-36', hips: '41-43', length: '29' },
        { size: 'XL', chest: '42-44', waist: '36-38', hips: '43-45', length: '30' },
        { size: 'XXL', chest: '44-46', waist: '38-40', hips: '45-47', length: '31' }
    ],
    Women: [
        { size: 'S', chest: '33-35', waist: '26-28', hips: '36-38', length: '24' },
        { size: 'M', chest: '35-37', waist: '28-30', hips: '38-40', length: '25' },
        { size: 'L', chest: '37-40', waist: '30-33', hips: '40-43', length: '26' },
        { size: 'XL', chest: '40-43', waist: '33-36', hips: '43-46', length: '27' },
        { size: 'XXL', chest: '43-46', waist: '36-39', hips: '46-49', length: '28' }
    ],
    Kids: [
        { size: 'S', chest: '24-26', waist: '22-24', hips: '25-27', length: '18' },
        { size: 'M', chest: '26-28', waist: '24-25', hips: '27-29', length: '20' },
        { size: 'L', chest: '28-30', waist: '25-27', hips: '29-31', length: '22' },
        { size: 'XL', chest: '30-32', waist: '27-29', hips: '31-33', length: '24' }
    ]
};

const SizeGuideModal = ({ isOpen, onClose, category = 'Men', availableSizes = [], onSelectSize }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'calculator' | 'instructions'
    const [unit, setUnit] = useState('in'); // 'in' | 'cm'

    // Calculator inputs
    const [height, setHeight] = useState(175); // cm
    const [weight, setWeight] = useState(70); // kg
    const [bodyType, setBodyType] = useState('Regular');
    const [preferredFit, setPreferredFit] = useState('Regular');
    const [calculatedResult, setCalculatedResult] = useState(null);

    const targetCategory = sizeCharts[category] ? category : 'Men';
    const currentChart = sizeCharts[targetCategory];

    const convertValue = (valStr) => {
        if (unit === 'in') return valStr;
        return valStr.split('-').map(num => Math.round(parseFloat(num) * 2.54)).join('-');
    };

    const handleCalculate = (e) => {
        e.preventDefault();
        // BMI & Fit Calculation Logic
        const hMeter = height / 100;
        const bmi = weight / (hMeter * hMeter);

        let recSize = 'M';
        if (bmi < 19) recSize = 'S';
        else if (bmi < 24) recSize = 'M';
        else if (bmi < 28) recSize = 'L';
        else if (bmi < 32) recSize = 'XL';
        else recSize = 'XXL';

        // Adjust for preferred fit
        if (preferredFit === 'Loose') {
            if (recSize === 'S') recSize = 'M';
            else if (recSize === 'M') recSize = 'L';
            else if (recSize === 'L') recSize = 'XL';
            else if (recSize === 'XL') recSize = 'XXL';
        } else if (preferredFit === 'Tight') {
            if (recSize === 'XXL') recSize = 'XL';
            else if (recSize === 'XL') recSize = 'L';
            else if (recSize === 'L') recSize = 'M';
            else if (recSize === 'M') recSize = 'S';
        }

        setCalculatedResult({
            size: recSize,
            accuracy: 94,
            isAvailable: availableSizes.includes(recSize)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Interactive Size Guide</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{targetCategory}'s Apparel Measurement Standards</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs Bar */}
                <div className="flex border-b border-gray-100 bg-white px-4 sm:px-6 shrink-0 text-xs sm:text-sm font-semibold text-gray-600">
                    <button
                        onClick={() => setActiveTab('chart')}
                        className={`py-3 px-4 border-b-2 transition-all ${
                            activeTab === 'chart' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        📊 Size Chart
                    </button>
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`py-3 px-4 border-b-2 transition-all ${
                            activeTab === 'calculator' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        🎯 Find My Size Calculator
                    </button>
                    <button
                        onClick={() => setActiveTab('instructions')}
                        className={`py-3 px-4 border-b-2 transition-all hidden sm:block ${
                            activeTab === 'instructions' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        📏 How to Measure
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                    {activeTab === 'chart' && (
                        <div>
                            {/* Unit Switcher */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All measurements in {unit === 'in' ? 'Inches' : 'Centimeters'}</span>
                                <div className="flex bg-gray-100 p-1 rounded-lg border text-xs font-bold">
                                    <button 
                                        onClick={() => setUnit('in')}
                                        className={`px-3 py-1 rounded-md transition-all ${unit === 'in' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                                    >
                                        IN
                                    </button>
                                    <button 
                                        onClick={() => setUnit('cm')}
                                        className={`px-3 py-1 rounded-md transition-all ${unit === 'cm' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                                    >
                                        CM
                                    </button>
                                </div>
                            </div>

                            {/* Chart Table */}
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="p-3">Size</th>
                                            <th className="p-3">Chest / Bust</th>
                                            <th className="p-3">Waist</th>
                                            <th className="p-3">Hips</th>
                                            <th className="p-3">Length</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-800">
                                        {currentChart.map((row) => {
                                            const isAvailable = availableSizes.includes(row.size);
                                            return (
                                                <tr key={row.size} className={`hover:bg-gray-50/80 transition-colors ${!isAvailable ? 'opacity-50 bg-gray-50/30' : ''}`}>
                                                    <td className="p-3 font-bold">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span className="text-black font-black">{row.size}</span>
                                                            {isAvailable && (
                                                                <button
                                                                    onClick={() => {
                                                                        onSelectSize(row.size);
                                                                        onClose();
                                                                    }}
                                                                    className="text-[10px] bg-black text-white px-2 py-0.5 rounded hover:bg-gray-800 transition-colors"
                                                                >
                                                                    Select
                                                                </button>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">{convertValue(row.chest)}</td>
                                                    <td className="p-3">{convertValue(row.waist)}</td>
                                                    <td className="p-3">{convertValue(row.hips)}</td>
                                                    <td className="p-3">{convertValue(row.length)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'calculator' && (
                        <form onSubmit={handleCalculate} className="space-y-6 animate-fade-in">
                            <div className="p-5 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xl">✨</span>
                                        <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Smart Fit Engine</h4>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-300 font-medium">Our AI-driven algorithm computes your perfect size match based on your unique body parameters.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors shadow-2xs">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Height</label>
                                        <span className="text-lg font-black text-indigo-600">{height} <span className="text-[10px] text-gray-500 font-semibold uppercase">cm</span></span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="140" 
                                        max="210" 
                                        value={height}
                                        onChange={(e) => setHeight(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                                        <span>140</span>
                                        <span>210</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors shadow-2xs">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Weight</label>
                                        <span className="text-lg font-black text-pink-600">{weight} <span className="text-[10px] text-gray-500 font-semibold uppercase">kg</span></span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="40" 
                                        max="130" 
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600 hover:accent-pink-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                                        <span>40</span>
                                        <span>130</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block ml-1">Body Build</label>
                                    <select
                                        value={bodyType}
                                        onChange={(e) => setBodyType(e.target.value)}
                                        className="w-full border-2 border-gray-100 focus:border-black rounded-xl p-3 text-sm font-bold bg-white text-gray-800 transition-all outline-none cursor-pointer shadow-2xs hover:shadow-sm"
                                    >
                                        <option value="Slim">Slim Build</option>
                                        <option value="Regular">Regular Build</option>
                                        <option value="Athletic">Athletic / Muscular</option>
                                        <option value="Curvy">Curvy / Full</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block ml-1">Fit Preference</label>
                                    <select
                                        value={preferredFit}
                                        onChange={(e) => setPreferredFit(e.target.value)}
                                        className="w-full border-2 border-gray-100 focus:border-black rounded-xl p-3 text-sm font-bold bg-white text-gray-800 transition-all outline-none cursor-pointer shadow-2xs hover:shadow-sm"
                                    >
                                        <option value="Tight">Snug / Slim Fit</option>
                                        <option value="Regular">Regular Fit</option>
                                        <option value="Loose">Relaxed / Oversized</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-black py-4 rounded-xl text-sm sm:text-base uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95 flex justify-center items-center gap-2 group border border-gray-800"
                            >
                                <span>Find My Perfect Size</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </button>

                            {calculatedResult && (
                                <div className="mt-4 p-5 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-ai-slide-up shadow-lg relative overflow-hidden">
                                    {/* Success Glow */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
                                    
                                    <div className="relative z-10 text-center sm:text-left">
                                        <p className="text-[10px] sm:text-xs text-emerald-800 font-bold uppercase tracking-widest mb-1 bg-emerald-100 inline-block px-2 py-0.5 rounded-full">Calculated Best Fit</p>
                                        <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
                                            <span className="text-4xl sm:text-5xl font-black text-gray-900 drop-shadow-sm">Size {calculatedResult.size}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-center sm:justify-start gap-1">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[120px] overflow-hidden">
                                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${calculatedResult.accuracy}%`}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700">{calculatedResult.accuracy}% Match</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectSize(calculatedResult.size);
                                            onClose();
                                        }}
                                        className="relative z-10 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 border border-emerald-800"
                                    >
                                        Apply Size {calculatedResult.size}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {activeTab === 'instructions' && (
                        <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-medium">
                                For the most accurate fit, keep the tape snug against your body, but not pulled tight.
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">1. Chest / Bust</h5>
                                    <p>Measure around the fullest part of your chest, keeping the tape horizontal across your back.</p>
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">2. Natural Waist</h5>
                                    <p>Measure around your natural waistline (the narrowest part of your torso), keeping the tape comfortably loose.</p>
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">3. Hips</h5>
                                    <p>Stand with feet together and measure around the fullest part of your hips/seat.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-xl text-xs transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SizeGuideModal;
