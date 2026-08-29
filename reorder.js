const fs = require('fs');
const file = 'c:/Users/ASUS/OneDrive/Desktop/forever-full-stack/admin/src/components/AdminOrderModal.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('bg-gray-900/20 backdrop-blur-sm animate-fade-in', 'bg-gray-900/20 animate-fade-in');

const statusManagementRegex = /\{\/\* Status Update Action Control \*\/\}[\s\S]*?\{\/\* Progress Stepper View \*\/\}/;
const statusUpdateMatch = content.match(statusManagementRegex);
let statusUpdateBlock = statusUpdateMatch[0].replace('{/* Progress Stepper View */}', '').trim();

const stepperRegex = /\{\/\* Progress Stepper View \*\/\}[\s\S]*?\{\/\* Shipping Address \& Financial Cards \*\/\}/;
const stepperMatch = content.match(stepperRegex);
let stepperBlock = stepperMatch[0].replace('{/* Shipping Address & Financial Cards */}', '').trim();

const shippingRegex = /\{\/\* Shipping Address \& Financial Cards \*\/\}[\s\S]*?\{\/\* Status History Audit Log \*\/\}/;
const shippingMatch = content.match(shippingRegex);
let shippingBlock = shippingMatch[0].replace('{/* Status History Audit Log */}', '').trim();

const auditRegex = /\{\/\* Status History Audit Log \*\/\}[\s\S]*?\{\/\* Order Product Items \*\/\}/;
const auditMatch = content.match(auditRegex);
let auditBlock = auditMatch[0].replace('{/* Order Product Items */}', '').trim();

const itemsRegex = /\{\/\* Order Product Items \*\/\}[\s\S]*?<\/div>\s*\{\/\* Footer \*\/\}/;
const itemsMatch = content.match(itemsRegex);
let itemsBlock = itemsMatch[0].replace('</div>\n\n                {/* Footer */}', '').trim();

const bodyRegex = /\{\/\* Modal Body \*\/\}\s*<div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">[\s\S]*?<\/div>\s*\{\/\* Footer \*\/\}/;

const newBody = `{/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                    ${shippingBlock}

                    ${itemsBlock}

                    ${statusUpdateBlock}

                    ${stepperBlock}

                    ${auditBlock}
                </div>`;

content = content.replace(bodyRegex, newBody + '\n\n                {/* Footer */}');

fs.writeFileSync(file, content);
console.log("File reordered successfully");
