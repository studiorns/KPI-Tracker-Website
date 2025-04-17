/**
 * Initialize collapsible sections
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get all section toggle buttons
  const sectionToggles = document.querySelectorAll('.section-toggle');
  
  // Add click event listener to each toggle button
  sectionToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      // Get the section content element
      const sectionHeader = this.closest('.section-header');
      const sectionContent = sectionHeader.nextElementSibling;
      
      // Toggle the collapsed class on the content
      sectionContent.classList.toggle('collapsed');
      
      // Toggle the collapsed class on the button
      this.classList.toggle('collapsed');
      
      // Update the aria-expanded attribute
      const isExpanded = !sectionContent.classList.contains('collapsed');
      this.setAttribute('aria-expanded', isExpanded);
      
      // If the section is now expanded and contains charts, trigger a resize event
      // to ensure the charts render correctly
      if (isExpanded) {
        window.dispatchEvent(new Event('resize'));
      }
    });
  });
});
