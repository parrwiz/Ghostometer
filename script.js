
const STATUS = {
    IN_PROGRESS: 'inProgress',
    GHOSTED: 'ghosted',
    REJECTED: 'rejected',
    INTERVIEW: 'interview',
    OFFERS: 'offers'
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    loadApplications();
    initializeTabNavigation();
    initializeApplicationForm();
  });
  

  async function loadApplications() {
    const applications = await getStoredApplications();
    checkForGhostedApplications(applications);
    displayApplicationsByStatus(applications);
  }
  
  async function getStoredApplications() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['applications'], (result) => {
        resolve(result.applications || []);
      });
    });
  }
  

  function saveApplications(applications) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ applications }, resolve);
    });
  }
  

  function checkForGhostedApplications(applications) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
    applications.forEach(app => {
      if (app.status === STATUS.IN_PROGRESS) {
        const applicationDate = new Date(app.dateAdded);
        if (applicationDate < thirtyDaysAgo) {
          app.status = STATUS.GHOSTED;
        }
      }
    });
  
    saveApplications(applications);
  }
  

  function initializeTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
  
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }
  

  function initializeApplicationForm() {
    const form = document.getElementById('applicationForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const companyName = document.getElementById('companyName').value;
      const jobLink = document.getElementById('jobLink').value;
  
      const newApplication = {
        id: Date.now(),
        companyName,
        jobLink,
        status: STATUS.GHOSTED,
        dateAdded: new Date().toISOString()
      };
  
      const applications = await getStoredApplications();
      applications.push(newApplication);
      await saveApplications(applications);
      
      form.reset();
      loadApplications();
    });
  }

  function displayApplicationsByStatus(applications) {
    Object.values(STATUS).forEach(status => {
      const container = document.querySelector(`#${status} .applications-list`);
      container.innerHTML = '';
  
      const filteredApps = applications.filter(app => app.status === status);
      filteredApps.forEach(app => {
        container.appendChild(createApplicationCard(app));
      });
    });
  }
  

  function createApplicationCard(application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    
    const dateBadge = document.createElement('span');
    dateBadge.className = 'date-badge';
    dateBadge.textContent = new Date(application.dateAdded).toLocaleDateString();
    
    const title = document.createElement('h3');
    title.textContent = application.companyName;
    
    const link = document.createElement('a');
    link.href = application.jobLink;
    link.textContent = 'View Job Posting';
    link.target = '_blank';
    
    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    
    Object.entries(STATUS).forEach(([key, value]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = key.replace('_', ' ').toLowerCase();
      option.selected = value === application.status;
      statusSelect.appendChild(option);
    });
    
    statusSelect.addEventListener('change', async () => {
      const applications = await getStoredApplications();
      const index = applications.findIndex(app => app.id === application.id);
      applications[index].status = statusSelect.value;
      await saveApplications(applications);
      loadApplications();
    });
    
    card.appendChild(dateBadge);
    card.appendChild(title);
    card.appendChild(link);
    card.appendChild(statusSelect);
    
    return card;
  }