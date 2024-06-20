<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>XML to XLSX Converter</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js"></script>
    <link class="icon" rel="icon" type="image/x-icon" href="Images/Favicon.png">
    <link rel="stylesheet" href="Code/styles.css">
</head>
<body>
    <div class="banner">
        <a target="blank" href="https://www.lafayette-engineering.com/"><img src="https://www.lafayette-engineering.com/wp-content/uploads/2024/01/lafayette_engineering_logo.webp" alt="LEI Logo"></a>
        <p><b>Take your Hytrol XML Files and Convert them to Excel Sheets.</b></p>
    </div>
    <main>
        <h1>XML Parser</h1>
        <div class="content">
            <div class="directions">
                <h2>Directions</h2>
                <ol>
                    <li>In AutoCad 2021, launch Hytrol and create your conveyor.</li>
                    <li>In the Hytrol menu click file, then export project(.XML)</li>
                    <li>Once done loading, name your file and save.</li>
                    <li>Go to this website and press choose file.</li>
                    <li>Choose your .xml file.</li>
                    <li>Press the process button.</li>
                    <li>It should download automatically, but if it does not, click the download link.</li>
                    <li>Click on your download to pull up the XLSX.</li>
                </ol>
            </div>
            <div class="file-zone">
                <h2>Choose a File</h2>
                <input type="file" id="xmlFileInput" accept=".xml" hidden><label for="xmlFileInput" class="file-input" id="file-input"><span>Select a file</span><button class="btn" data-icon="&#xF4F8">Browse</button>
                </label>
                <button id="processButton" data-icon="&#xf1c3" class="btn wide" disabled>Convert to XLSX</button>
                <button id="downloadLink" data-icon="&#xF30A" class="btn wide" style="display: none;">Download Again
                    <a id='downloadanchor' href="" download="" hidden></a>
                </button>
            </div>
        </div>
    </main>
    <footer>
        <p>For questions and suggestions, email <a href='mailto:lafayette.xmlparser@gmail.com'>LaFayette.XmlParser@Gmail.Com</a></p>
        <p>LaFayette Phone Number <a href="tel:(859) 236-6884">(859) 236-6884</a></p>
    </footer>
    <script>
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

        // Add event listener for the file input to display file name and enable process button
document.getElementById('xmlFileInput').addEventListener('change', () => {const fileInput = document.getElementById('xmlFileInput');
            const fileLabel = document.getElementById('file-input');
            const fileName = fileInput.files[0].name;
            fileLabel.querySelector('span').textContent = fileName;
            document.getElementById('processButton').disabled = false;});

        // When button clicked, trigger file input click
        document.querySelector('.btn').addEventListener('click', () => {document.getElementById('xmlFileInput').click();});

        // When the process button is clicked, process the selected XML file
document.getElementById('processButton').addEventListener('click', async () => {const fileInput = document.getElementById('xmlFileInput');
            const downloadLink = document.getElementById('downloadLink');

            // Ensure a file is selected
            if (fileInput.files.length === 0) {alert('Please select an XML file.'); return;}
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
            propertiesElements.forEach(propertiesElement => {const psAmpValuesMap = new Map();
                const refNameElements = propertiesElement.querySelectorAll('RefName');

                // Reset variables for each new Properties element
                curveValue = '';
                infeedValue = '';
                dischargeValue = '';
                hpValue = '';
                iopCountValue = '';
                speedValue = '';
                weightValue = '';

                // Parse through each ref name and find the value to record
refNameElements.forEach(refNameElement => {const propertyName = refNameElement.textContent;
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
                    } else if (propertyName === 'overalllength') {
                        lengthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'infeedheight') {
                        infeedValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'dischargeheight') {
                        dischargeValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent));
                    } else if (propertyName === 'hp') {
                        hpValue = parseFloat(valueElement.textContent).toFixed(2);
                    } else if (propertyName === 'fpm') {
                        speedValue = parseFloat(valueElement.textContent).toFixed(2);
                    } else if (propertyName === 'conveyorweight') {
                        weightValue = parseFloat(valueElement.textContent.trim()).toFixed(2);
                        if (weightValue === '0.00') {weightValue = '';}
                    } else if (propertyName === 'powersupplysize') {
                        const psAmpValue = valueElement.textContent;
                        if (psAmpValue.trim() === '') {
                            psAmpValuesMap.set('', (psAmpValuesMap.get('') || 0) + 1);
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
                        const hasCloserollers = valueElement.textContent.toLowerCase() === 'true';
                        if (hasCloserollers) {
                            railValue = '0 ft 2 in';
                        } else {
                            railValue = '0 ft 3 in';
                        }
                    }
                });

                if (/C/.test(modelValue)) {
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

                psAmpValuesMap.forEach((count, amp) => {
                    const existingCount = quantityByCombination[combinationKey].psAmpValuesMap.get(amp) || 0;
                    quantityByCombination[combinationKey].psAmpValuesMap.set(amp, existingCount + count);
                });
            });

            const worksheet = XLSX.utils.aoa_to_sheet([[
                'Unit Mark', 'Model', 'Width', 'Rlr Ctrs', 'Curve', 'Length',
                'Inf El', 'Dis El', 'HP', 'PS Qty', 'PS Amp', 'IOP Qty',
                'Speed', 'Weight', 'List Price', 'Cost'
            ]]);

            let totalPrice = 0;
            let isFirstRow = true;
            for (const combinationKey in quantityByCombination) {
                if (quantityByCombination.hasOwnProperty(combinationKey)) {
                    if (isFirstRow) {
                        isFirstRow = false;
                        continue; // Skip the first row
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

            XLSX.utils.sheet_add_aoa(worksheet, [[
                '', '', '', '', '', '', '', '', '', '', '', '', '',   `Total Prices`, `$${totalPrice.toFixed(2)}`
            ]], {origin: -1});

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

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

            const xmlFileName = xmlFile.name.replace(/\s+/g, '_').replace('.xml', '');
            const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            const blob = new Blob([xlsxData], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const downloadAnchor = document.getElementById('downloadanchor');
            downloadAnchor.setAttribute('href', url);
            downloadAnchor.setAttribute('download', `${xmlFileName}.xlsx`);

            downloadLink.addEventListener('click', function () {downloadAnchor.click();});

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
    </script>
</body>
</html>
