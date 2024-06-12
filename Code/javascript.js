// Function to format inches to feet and inches.
    function formatInchesToFeetAndInches(inches) {
        const feet = Math.floor(inches / 12);
        let remainingInches = inches % 12;
        
        // Formats inches to two points after decimal.
        remainingInches = parseFloat(remainingInches.toFixed(2)); 
        if (remainingInches >= 12) {
            feet += 1;
            remainingInches -= 12;
        };
        
        // Takes any remainder greater than 12 and makes it a new foot.
        return `${feet} ft ${remainingInches} in`;
    }

    // Add event listener for the file input 'file-input' to display file name in span child element.
    document.getElementById('xmlFileInput').addEventListener('change', () => {
        const fileInput = document.getElementById('xmlFileInput');
        const fileLabel = document.getElementById('file-input');
        const fileName = fileInput.files[0].name;
        fileLabel.querySelector('span').textContent = fileName;

        // if valid file set process button to active.
        document.getElementById('processButton').disabled = false;
    });

    // Add event listener for the file input 'file-input' to display file name in span child element.
    document.getElementById('file-input').querySelector('.btn').addEventListener('click', () => {
        document.getElementById('xmlFileInput').click();
    });

    // Event listener for the process button.
    document.getElementById('processButton').addEventListener('click', async () => { 
        // Looks for the file and any previous download links.
        const fileInput = document.getElementById('xmlFileInput');
        const downloadLink = document.getElementById('downloadLink');
                
        // Checks to ensure a file is submitted.
        if (fileInput.files.length === 0) {
            alert('Please select an XML file.');
            return;
        };
                
        // Set file data for parsing.
        const xmlFile = fileInput.files[0];
        const xmlData = await xmlFile.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
                
        // Initialize variables for property values.
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
        const quantityByCombination = {};
        const propertiesElements = xmlDoc.querySelectorAll('Properties');
        
    // Iterate through 'Properties' elements.
    propertiesElements.forEach(propertiesElement => {
        const psAmpValuesMap = new Map(); // Creates a map to count amp values.
        const refNameElements = propertiesElement.querySelectorAll('RefName');

        // Reset variables for each new Properties element.
        curveValue = '0';
        infeedValue = '0';
        dischargeValue = '0';
        hpValue = '0';
        iopCountValue = '0';
        speedValue = '0';

        // Parse through each ref name.
        refNameElements.forEach(refNameElement => { 
            const propertyName = refNameElement.textContent;
            const valueElement = refNameElement.nextElementSibling;

            // Assign values based on property name.
            if (propertyName === 'MarkNumber') {
                markedAttribute = valueElement.textContent;
            } else if (propertyName === 'Model') {
                modelValue = valueElement.textContent;
            } else if (propertyName === 'iopcount') {
                iopCountValue = valueElement.textContent;
            } else if (propertyName === 'overallwidth') { 
                // Formats to inches when called.
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
                
                // Check if 'E24' is part of the model name before setting hpValue.
                if (!/e24/i.test(modelValue)) {
                    hpValue = valueElement.textContent;
                } else {
                    hpValue = '0';
                }
                
            } else if (propertyName === 'fpm') {
                speedValue = valueElement.textContent;
            } else if (propertyName === 'conveyorweight') {
                weightValue = valueElement.textContent;
            } else if (propertyName === 'powersupplysize') {
                const psAmpValue = valueElement.textContent;
                
                // If there is nothing, a zero is added.
                if (psAmpValue.trim() === '') { 
                    psAmpValuesMap.set('0', (psAmpValuesMap.get('0') || 0) + 1);
                } else if (psAmpValue.toLowerCase() !== 'less power supply') {
                    const ampMatch = psAmpValue.match(/\d+/); 
                    
                    // The case for the ref of LPS turned into a value.
                    if (ampMatch) {
                        const amp = ampMatch[0];
                        psAmpValuesMap.set(amp, (psAmpValuesMap.get(amp) || 0) + 1);
                    }
                }
                
            } else if (propertyName === 'TotalPrice') {
                // Make to two decimals out.
                priceValue = `$${parseFloat(valueElement.textContent || '0').toFixed(2)}`; 
            } else if (propertyName === 'hascloserollers') {
                // Check for 'hascloserollers' value.
                hasCloserollers = valueElement.textContent.toLowerCase() === 'true'; 
                if (hasCloserollers) {
                    railValue = '0 ft 2 in';
                } else if (!hasCloserollers) {
    	            lengthValue = '0';
                    railValue = '0 ft 3 in';
                }
            }
        });

        // Generate a unique key for this combination of properties to check for repeated lines.
        const combinationKey = `${markedAttribute}_${modelValue}_${priceValue}`;

        // Store or update the combination's properties and quantities for each new line.
        if (!quantityByCombination[combinationKey]) {
            quantityByCombination[combinationKey] = {
                quantity: 0,
                psAmpValuesMap: new Map(),
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

        // Add the current amps to the combination's map of amps.
        psAmpValuesMap.forEach((count, amp) => {
            const existingCount = quantityByCombination[combinationKey].psAmpValuesMap.get(amp) || 0;
            quantityByCombination[combinationKey].psAmpValuesMap.set(amp, existingCount + count);
        });
    });

        // Prepare CSV data.
        let csvData = '';
        let totalPrice = 0;
        let isFirstRow = true;
        
        // Add Column titles to CSV data.
        const headersRow = 'Unit Mark, Model, Width, Rlr Ctrs, Curve, Length, Inf El, Dis El, HP, PS Qty, PS Amp, IOP Qty, Speed, Weight, List Price, Cost\n';
        csvData = headersRow + csvData;
        
        // Loop through each combination.
        for (const combinationKey in quantityByCombination) {
            // If a unique row.
            if (quantityByCombination.hasOwnProperty(combinationKey)) {
                const combination = quantityByCombination[combinationKey]; // Add to combination key.
                const ampsArray = [];
                let quantitySum = 0;

                // Add psamp column.
                combination.psAmpValuesMap.forEach((count, amp) => {
                    ampsArray.push(`${count}x${amp}`);
                    quantitySum += count;
                });

                let ampsRow = ampsArray.join('|'); // Combine counts and amps.

                // Replace blanks with zero
                if (ampsRow === '') {
                    ampsRow = '0';
                }
                // Declaration of order that the columns from the combinations is placed in each row.
                const csvRow = `${combination.markedAttribute},${combination.modelValue},${combination.widthValue},${combination.railValue},${combination.curveValue},${combination.lengthValue},${combination.infeedValue},${combination.dischargeValue},${combination.hpValue},${quantitySum},${ampsRow},${combination.iopCountValue},${combination.speedValue},${combination.weightValue},${combination.price}\n`; 
        
                // Skip the first row (It always prints blank due to the combination process. Easiest solution.)
                if (isFirstRow) {
                    isFirstRow = false;
                    continue;
                };
        
                // Add the data to each row.
                csvData += csvRow;
                // Accumulate price for total price
                totalPrice += parseFloat(combination.price.replace('$', ''));
            };
        };
        
        // Add total price row to CSV data.
        const totalRow = ` , , , , , , , , , , , , ,  Total Prices, $${totalPrice.toFixed(2)}, $`;
        csvData += totalRow + '\n';
        
        // Create a Blob containing the CSV data.
        const blob = new Blob([csvData], {
            type: 'text/csv'
        });
                
        // Create a unique file name correlated to the parsed file's name.
        const xmlFileName = xmlFile.name.replace(/\s+/g, '_').replace('.xml', ''); 
        
        // set blob filename to download link.
        var url = URL.createObjectURL(blob);
        var downloadAnchor = document.getElementById('downloadanchor');
        downloadAnchor.setAttribute('href', url);
        
        // Set the download link to the file name.
        downloadAnchor.setAttribute('download', `${xmlFileName}.csv`); 

        // Add click event to download link to trigger download anchor.
        downloadLink.addEventListener('click', function() {
            downloadAnchor.click();
        });
        
        // Trigger the download
        if (totalPrice > 0) { 
            // Starts as long as there is something there.
            downloadLink.style.display = 'flex';
            downloadAnchor.click();
            URL.revokeObjectURL(url);
        } else {
            alert('No data to download.');
            downloadLink.style.display = 'none';
            downloadAnchor.removeAttribute('href'); 
            downloadAnchor.removeAttribute('download'); 
            downloadLink.removeEventListener('click');
        };
    });
