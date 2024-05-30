//Creates an event for clicking on the collapsible directions.
var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", 
        function() {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight){
                        content.style.maxHeight = null;
                } else {
                        content.style.maxHeight = content.scrollHeight + "px";
                } ;
        });
};

// Function to format inches to feet and inches
function formatInchesToFeetAndInches(inches) {
        const feet = Math.floor(inches / 12);
        let remainingInches = inches % 12;
        remainingInches = parseFloat(remainingInches.toFixed(2)); // Formats inches to two points after decimal.
        if (remainingInches >= 12) {
                feet += 1;
                remainingInches -= 12;
        };
        
        // Takes any remainder greater than 12 and makes it a new foot.
        return `${feet} ft ${remainingInches} in`;
}; 

// Event listener for the process button
document.getElementById('processButton').addEventListener('click', async () => {
        const fileInput = document.getElementById('xmlFileInput'); // Looks for the file and any previous download links.
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
                
        // Initialize variables for property values
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
        
        // Iterate through 'Properties' elements
        propertiesElements.forEach(propertiesElement => {
                psAmpValues = new Set(); // Creates a set of values for amps.
                const refNameElements = propertiesElement.querySelectorAll('RefName');
        
                // Reset variables for each new Properties element
                curveValue = '0';
                infeedValue = '0';
                dischargeValue = '0';
                hpValue = '0';
                iopCountValue = '0';
                speedValue = '0';
                
                // Parses through each ref name.
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
                                widthValue = formatInchesToFeetAndInches(parseFloat(valueElement.textContent)); // Formats to inches when called.
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
                                
                                // If there is nothing, a zero is added.
                                if (psAmpValue.trim() === '') { 
                                        psAmpValues.add('0');
                                } else if (psAmpValue.toLowerCase() !== 'less power supply') {
                                        const ampMatch = psAmpValue.match(/\d+/); 
                                        
                                        // The case for the ref of LPS turned into a value.
                                        if (ampMatch) {
                                                psAmpValues.add(ampMatch[0]);
                                        };
                                };
                        } else if (propertyName === 'TotalPrice') {
                                priceValue = `$${parseFloat(valueElement.textContent || '0').toFixed(2)}`; // Make to two decimals out.
                        };
                });
        
                // Generate a unique key for this combination of properties to check for repeated lines.
                const combinationKey = `${markedAttribute}_${modelValue}_${priceValue}`;
        
                // Store or update the combination's properties and quantities for each new line.
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
                };
        
                // Add the current amps to the combination's set of amps
                psAmpValues.forEach(psAmp => {
                        quantityByCombination[combinationKey].psAmpValues.add(psAmp);
                });
        });
        
        // Prepare CSV data
        let csvData = '';
        let totalPrice = 0;
        let isFirstRow = true;
        
        // Add Column titles to CSV data
        const headersRow = 'Unit Mark, Model, Width, Rlr Ctrs, Curve, Length, Inf El, Dis El, HP, PS Qty, PS Amp, IOP Qty, Speed, Weight, List Price, Cost\n';
        csvData = headersRow + csvData;
        
        // Loop through each combination
        for (const combinationKey in quantityByCombination) {
                // If a unique row.
                if (quantityByCombination.hasOwnProperty(combinationKey)) {
                        const combination = quantityByCombination[combinationKey]; // Add to combination key.
                        let ampsRow = Array.from(combination.psAmpValues).join('|'); // Add psamp column.
                        const quantityRow = combination.psAmpValues.size; // Add quantity(based on the size of psamp array).
                
                        // Replace blanks with zero
                        if (ampsRow === '') {
                                ampsRow = '0';
                        };
                        const csvRow = `${combination.markedAttribute},${combination.modelValue},${combination.widthValue},${combination.railValue},${combination.curveValue},${combination.lengthValue},${combination.infeedValue},${combination.dischargeValue},${combination.hpValue},${quantityRow},${ampsRow},${combination.iopCountValue},${combination.speedValue},${combination.weightValue},${combination.price}\n`; // Declaration of order that the columns from the combinations is placed in each row.
                
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
        
        // Add total price row to CSV data
        const totalRow = ` , , , , , , , , , , , , ,  Total Prices, $${totalPrice.toFixed(2)}, $`;
        csvData += totalRow + '\n';
        
        // Create a Blob containing the CSV data
        const blob = new Blob([csvData], {
                type: 'text/csv'
        });
                
        // Create a unique file name correlated to the parsed file's name.
        const xmlFileName = xmlFile.name.replace(/\s+/g, '_').replace('.xml', ''); 
        downloadLink.href = URL.createObjectURL(blob); // Create a download link for file.
        downloadLink.download = `${xmlFileName}.csv`;
        
        // Trigger the download
        if (totalPrice > 0) { // Starts as long as there is something there.
                downloadLink.style.display = 'block';
                downloadLink.click();
                URL.revokeObjectURL(downloadLink.href);
        } else {
                alert('No data to download.');
                downloadLink.style.display = 'none';
        };
});

//Note: May change from csv to xlxs. However, this would require libraries not native to github. Xlxs allows for stylisation of the excel sheet beforehand. This could
//prevent excel sheets from considering mark numbers like- 03-11-1453 as dates. This isn't a big issue currently though. So I'm focusing on completing the accuracy. May take
//this note out later if I end up getting to that. Will work on it-may take too long to find a proper solution.