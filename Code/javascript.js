function formatInchesToFeetAndInches(inches) {
    const feet = Math.floor(inches / 12);
    let remainingInches = inches % 12;
    remainingInches = parseFloat(remainingInches.toFixed(2));
    if (remainingInches >= 12) {
        feet += 1;
        remainingInches -= 12;
    }
    return `${feet} ft ${remainingInches} in`;
}

document.getElementById('processButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('xmlFileInput');
    const downloadLink = document.getElementById('downloadLink');

    if (fileInput.files.length === 0) {
        alert('Please select an XML file.');
        return;
    }

    const xmlFile = fileInput.files[0];
    const xmlData = await xmlFile.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

    let markedAttribute = '';
    let iopCountValue = '0';
    let modelValue = '0';
    let widthValue = '0';
    let railValue = '0';
    let curveValue = '0';
    let lengthValue = '0';
    let infeedValue = '0';
    let dischargeValue = '0';
    let hpValue = '0';
    let speedValue = '0';
    let weightValue = '0';
    let priceValue = '0';
    let psAmpValues = new Set();
    const quantityByCombination = {};
    const propertiesElements = xmlDoc.querySelectorAll('Properties');

    propertiesElements.forEach(propertiesElement => {
        psAmpValues = new Set();
        const refNameElements = propertiesElement.querySelectorAll('RefName');

        curveValue = '0';
        infeedValue = '0';
        dischargeValue = '0';
        hpValue = '0';
        iopCountValue = '0';
        speedValue = '0';

        refNameElements.forEach(refNameElement => {
            const propertyName = refNameElement.textContent;
            const valueElement = refNameElement.nextElementSibling;

            if (propertyName === 'MarkNumber') {
                markedAttribute = valueElement.textContent;
            } else if (propertyName === 'Model') {
                modelValue = valueElement.textContent;
            } else if (propertyName === 'iopcount') {
                iopCountValue = valueElement.textContent;
            } else if (propertyName === 'overallwidth') {
                widthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
            } else if (propertyName === 'rollercenters') {
                railValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
            } else if (propertyName === 'curveangle') {
                curveValue = valueElement.textContent;
            } else if (propertyName === 'overalllength') {
                lengthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
            } else if (propertyName === 'infeedheight') {
                infeedValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
            } else if (propertyName === 'dischargeheight') {
                dischargeValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
            } else if (propertyName === 'hp') {
                hpValue = valueElement.textContent;
            } else if (propertyName === 'fpm') {
                speedValue = valueElement.textContent;
            } else if (propertyName === 'conveyorweight') {
                weightValue = valueElement.textContent;
            } else if (propertyName === 'powersupplysize') {
                const psAmpValue = valueElement.textContent;

                if (psAmpValue.trim() === '') {
                    psAmpValues.add('0');
                } else if (psAmpValue.toLowerCase() !== 'less power supply') {
                    const ampMatch = psAmpValue.match(/\d+/);
                    if (ampMatch) {
                        psAmpValues.add(ampMatch[0]);
                    }
                }
            } else if (propertyName === 'TotalPrice') {
                priceValue = `$${parseFloat(valueElement.textContent || '0').toFixed(2)}`;
            }
        });

        const combinationKey = `${markedAttribute}_${modelValue}_${priceValue}`;

        if (!quantityByCombination[combinationKey]) {
            quantityByCombination[combinationKey] = {
                quantity: 0,
                psAmpValues: new Set(),
                price: priceValue,
                modelValue: modelValue,
                markedAttribute: markedAttribute,
                iopCountValue: iopCountValue,
                widthValue: widthValue,
                railValue: railValue,
                curveValue: curveValue,
                lengthValue: lengthValue,
                infeedValue: infeedValue,
                dischargeValue: dischargeValue,
                hpValue: hpValue,
                speedValue: speedValue,
                weightValue: weightValue
            };
        }

        psAmpValues.forEach(psAmp => {
            quantityByCombination[combinationKey].psAmpValues.add(psAmp);
        });

        // Update quantity based on amp count conditions
        const ampCount = psAmpValues.size;
        if (ampCount === 2) {
            quantityByCombination[combinationKey].quantity += 1;
        } else if (ampCount === 3) {
            quantityByCombination[combinationKey].quantity += 3;
        } else {
            quantityByCombination[combinationKey].quantity++;
        }
    });

    let csvData = '';
    let totalPrice = 0;
    let isFirstRow = true;

    const headersRow = 'Unit Mark, Model, Width, Rlr Ctrs, Curve, Length, Inf El, Dis El, HP, PS Qty, PS Amp, IOP Qty, Speed, Weight, List Price, Cost\n';
    csvData = headersRow + csvData;

    for (const combinationKey in quantityByCombination) {
        if (quantityByCombination.hasOwnProperty(combinationKey)) {
            const combination = quantityByCombination[combinationKey];

            const ampCounts = {};
            combination.psAmpValues.forEach(psAmp => {
                if (ampCounts[psAmp]) {
                    ampCounts[psAmp] += 1;
                } else {
                    ampCounts[psAmp] = 1;
                }
            });

            let ampsRow = Object.entries(ampCounts).map(([amp, count]) => count > 1 ? `${count} ${amp}` : amp).join('|');
            const psQty = combination.psAmpValues.size;

            if (ampsRow === '') {
                ampsRow = '0';
            }

            const csvRow = `${combination.markedAttribute},${combination.modelValue},${combination.widthValue},${combination.railValue},${combination.curveValue},${combination.lengthValue},${combination.infeedValue},${combination.dischargeValue},${combination.hpValue},${psQty},${ampsRow},${combination.iopCountValue},${combination.speedValue},${combination.weightValue},${combination.price}\n`;

            if (isFirstRow) {
                isFirstRow = false;
                continue;
            }

            csvData += csvRow;
            totalPrice += parseFloat(combination.price.replace('$', ''));
        }
    }

    const totalRow = ` , , , , , , , , , , , , ,  Total Prices, $${totalPrice.toFixed(2)}, $`;
    csvData += totalRow + '\n';

    const blob = new Blob([csvData], {
        type: 'text/csv'
    });

    const xmlFileName = xmlFile.name.replace(/\s+/g, '_').replace('.xml', '');

    var url = URL.createObjectURL(blob);
    var downloadAnchor = document.getElementById('downloadanchor');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${xmlFileName}.csv`);

    downloadLink.addEventListener('click', function() {
        downloadAnchor.click();
    });

    if (totalPrice > 0) {
        downloadLink.style.display = 'flex';
        downloadAnchor.click();
        URL.revokeObjectURL(url);
    } else {
        alert('No data to download.');
        downloadLink.style.display = 'none';
        downloadAnchor.removeAttribute('href');
        downloadAnchor.removeAttribute('download');
        downloadLink.removeEventListener('click');
    }
});
