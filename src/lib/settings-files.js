export function saveJson ( dataToSave ) {
    const blob = new Blob( [ JSON.stringify( dataToSave ) ], { type: 'application/json' } );
    const a = document.createElement( 'a' );
    a.href = URL.createObjectURL( blob );
    a.download = 'featherise-settings.json';
    document.body.appendChild( a );
    a.click();
    document.body.removeChild( a );
}

export function loadJson() {
    return new Promise((resolve, reject) => {
        // Create a hidden file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.click();

        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    try {
                        const json = JSON.parse(content);
                        resolve(json); 
                    } catch (error) {
                        reject('Invalid JSON file'); 
                    }
                };
                reader.readAsText(file);
            } else {
                reject('No file selected');
            }
        });

        fileInput.addEventListener('click', function() {
            document.body.removeChild(fileInput);
        });
    });
}
