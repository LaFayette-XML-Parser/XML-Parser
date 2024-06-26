        // Formats inches to feet and inches
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

        // Function to format the price with commas
        function formatPrice(price) {
            return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }

        // Add event listener for the file input to display file name and enable process button
        document.getElementById('xmlFileInput').addEventListener('change', () => {
            const fileInput = document.getElementById('xmlFileInput');
            const fileLabel = document.getElementById('file-input');
            const fileName = fileInput.files[0].name;
            fileLabel.querySelector('span').textContent = fileName;
            document.getElementById('processButton').disabled = false;
        });

        // When button clicked, trigger file input click
        document.querySelector('.btn').addEventListener('click', () => {
            document.getElementById('xmlFileInput').click();
        });

        // When the process button is clicked, process the selected XML file
        document.getElementById('processButton').addEventListener('click', async () => {
            const fileInput = document.getElementById('xmlFileInput');
            const downloadLink = document.getElementById('downloadLink');

            // Ensure a file is selected
            if (fileInput.files.length === 0) {
                alert('Please select an XML file.');
                return;
            }

            // Parse the XML file
            const xmlFile = fileInput.files[0];
            const xmlData = await xmlFile.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

            // Initialize variables for property values
            let markedAttribute = '';
            let iopCountValue = '';
            let modelValue = '';
            let widthValue = '';
            let railValue = '';
            let curveValue = '';
            let lengthValue = '';
            let infeedValue = '';
            let dischargeValue = '';
            let hpValue = '';
            let speedValue = '';
            let weightValue = '';
            let priceValue = '0';
            const quantityByCombination = {};
            const propertiesElements = xmlDoc.querySelectorAll('Properties');

            // Iterate through 'Properties' elements
            propertiesElements.forEach(propertiesElement => {
                const psAmpValuesMap = new Map();
                const refNameElements = propertiesElement.querySelectorAll('RefName');

                // Reset variables for each new Properties element
                curveValue = '';
                infeedValue = '';
                dischargeValue = '';
                hpValue = '';
                iopCountValue = '';
                speedValue = '';
                weightValue = '';
                lengthValue = '';

                // Parse through each ref name and find the value to record
                refNameElements.forEach(refNameElement => {
                    const propertyName = refNameElement.textContent;
                    const valueElement = refNameElement.nextElementSibling;

                    // Assign values based on property name
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
                    } else if (propertyName === 'overallfloorlength') {
                        lengthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'overalllength'){
                        lengthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'infeedheight') {
                        infeedValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'dischargeheight') {
                        dischargeValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'hp') {
                        hpValue = parseFloat(valueElement.textContent);
                    } else if (propertyName === 'fpm') {
                        speedValue = parseFloat(valueElement.textContent);
                    } else if (propertyName === 'conveyorweight') {
                       weightValue = parseFloat(valueElement.textContent.trim()).toFixed(0);
                        if (weightValue === '0') {
                            weightValue = '';
                        }
                    } else if (propertyName === 'powersupplysize') {
                        const psAmpValue = valueElement.textContent;

                        // Makes a count of 0 if there is nothing there.
                        if (psAmpValue.trim() === '') {
                            psAmpValuesMap.set('', (psAmpValuesMap.get('') || 0) + 1);
                         
                        // Changes less power supply to 0.
                        } else if (psAmpValue.toLowerCase() !== 'less power supply') {
                            const ampMatch = psAmpValue.match(/\d+/);
                            if (ampMatch) {
                                const amp = ampMatch[0];
                                psAmpValuesMap.set(amp, (psAmpValuesMap.get(amp) || 0) + 1);
                            }
                        }
                    } else if (propertyName === 'TotalPrice') {
                        priceValue = parseFloat(valueElement.textContent || '0').toFixed(2);
                    } else if (propertyName === 'hascloserollers') {
                        // Makes value lowercase and checks the value inside. If it has the necessary value, its true.
                        const hasCloserollers = valueElement.textContent.toLowerCase() === 'true';
                        if (hasCloserollers) {
                            railValue = '0 ft 2 in';
                        } else {
                            railValue = '0 ft 3 in';
                        }
                    }
                });

                // Makes zeroes blank. Searches for instances.
                if (/C/.test(modelValue) && !/ACC/.test(modelValue)) {
                    lengthValue = '';
                }
                if (/E24/.test(modelValue)) {
                    hpValue = '';
                }
                if (iopCountValue === '0') {
                    iopCountValue = '';
                }
                if (hpValue === '0.00') {
                    hpValue = '';
                }
                const combinationKey = `${markedAttribute}_${modelValue}_${priceValue}`;

                // Creates a non-repeated combination.
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
                        weightValue: weightValue,
                    };
                }

                // Makes a count for amp based on the amount from the combination.
                psAmpValuesMap.forEach((count, amp) => {
                    const existingCount = quantityByCombination[combinationKey].psAmpValuesMap.get(amp) || 0;
                    quantityByCombination[combinationKey].psAmpValuesMap.set(amp, existingCount + count);
                });
            });

            // Creates the headers.
            const worksheet = XLSX.utils.aoa_to_sheet([[
                'Unit Mark', 'Model', 'Width', 'Rlr Ctrs', 'Curve', 'Length',
                'Inf El', 'Dis El', 'HP', 'PS Qty', 'PS Amp', 'IOP Qty',
                'Speed', 'Weight', 'List Price', 'Cost'
            ]]);

            let totalPrice = 0;
            let isFirstRow = true;

            // Skips the first row.
            for (const combinationKey in quantityByCombination) {
                if (quantityByCombination.hasOwnProperty(combinationKey)) {
                    if (isFirstRow) {
                        isFirstRow = false;
                        continue; 
                    }
                    const combination = quantityByCombination[combinationKey];
                    const ampsArray = [];
                    let quantitySum = 0;
                    combination.psAmpValuesMap.forEach((count, amp) => {
                        ampsArray.push(`${count}x${amp}`);
                        quantitySum += count;
                    });
                    if (quantitySum === 0) {
                        quantitySum = '';
                    }

                    // Everything placed in a row.
                    let ampsRow = ampsArray.join('|');
                    const row = [
                        combination.markedAttribute, combination.modelValue,
                        combination.widthValue, combination.railValue,
                        combination.curveValue, combination.lengthValue,
                        combination.infeedValue, combination.dischargeValue,
                        combination.hpValue, quantitySum, ampsRow,
                        combination.iopCountValue, combination.speedValue,
                        combination.weightValue, parseFloat(combination.price), ''
                    ];
                    XLSX.utils.sheet_add_aoa(worksheet, [row], {origin: -1});
                    totalPrice += parseFloat(combination.price);
                }
            }

            // Add the total price row.
            XLSX.utils.sheet_add_aoa(worksheet, [[
                '', '', '', '', '', '', '', '', '', '', '', '', '', 'Total Price', `$${formatPrice(totalPrice)}`
            ]], {origin: -1});

            // Get the XML file name and use it as the sheet name
            const xmlFileName = xmlFile.name.replace(/\s+/g, '_').replace('.xml', '');
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, xmlFileName);

            // Set column widths
            const colWidths = [
                { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
                { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
                { wch: 10 }
            ];
            worksheet['!cols'] = colWidths;

            // Set column format for List Price and Cost columns to currency
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let row = range.s.r + 1; row <= range.e.r; row++) {
                const cellO = worksheet[XLSX.utils.encode_cell({ r: row, c: 14 })];
                if (cellO) cellO.z = '$#,##0.00';
            }
            const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Create blob.
            const blob = new Blob([xlsxData], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const downloadAnchor = document.getElementById('downloadanchor');
            downloadAnchor.setAttribute('href', url);
            downloadAnchor.setAttribute('download', `${xmlFileName}.xlsx`);
            downloadLink.addEventListener('click', function () {downloadAnchor.click();});
            if (totalPrice > 0) {
                downloadAnchor.click();
                downloadLink.removeEventListener('click');
                URL.revokeObjectURL(url);
            } else {
                alert('No data to download.');
                downloadLink.style.display = 'none';
                downloadAnchor.removeAttribute('href');
                downloadAnchor.removeAttribute('download');
                downloadLink.removeEventListener('click');
            }
        });
