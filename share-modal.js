document.addEventListener('DOMContentLoaded', function() {
    const shareButton = document.getElementById('share-button');
    
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            console.log('Share button clicked');
        });
    } else {
        console.warn('Share button not found');
    }
});