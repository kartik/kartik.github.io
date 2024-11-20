// Data for Contacts
const supplierNames = [
  'General Motors', 'Toyota', 'Ford Motor Company', 'Honda', 'Tesla', 'Volkswagen', 'BMW', 'Daimler AG', 'Fiat Chrysler', 'Nissan', 'Hyundai', 'Kia Motors', 'Subaru', 'Mazda', 'Mitsubishi Motors', 'Suzuki', 'Renault', 'Peugeot', 'Citroen', 'Volvo', 'Jaguar Land Rover', 'Aston Martin',
  'Bentley Motors', 'Rolls-Royce', 'Ferrari', 'Lamborghini', 'Elite Repairs', 'Quick Fix Auto', 'RapidRepair Inc.',
  'AutoPro Service Center', 'DriveTime Repairs', 'Secure Storage Solutions', 'AutoVault Storage', 'Metro Storage',
  'ParkSafe Facilities', 'EZ Storage', 'Fast Transport', 'Express Logistics', 'Swift Haulage', 'Global Transport',
  'Transworld Logistics', 'Precision Inspection', 'Quality Check Services', 'Auto Inspectors Inc.', 'Certified Inspection',
  'AutoCheck Solutions', 'TitlePro Services', 'Auto Registrations LLC', 'QuickTitle Solutions', 'VDS Docs',
  'TitleExpress', 'Global Upfitters', 'Auto Customization Inc.', 'Upfit Solutions', 'Vehicle Modifications LLC',
  'Custom Auto Enhancements', 'Metro Resale', 'Auto Resellers Inc.', 'Value Cars', 'Second Hand Motors', 'Auto Auctions Ltd.'
];

const clientNames = [
  'Amazon', 'PepsiCo', 'Walmart', 'IKEA', 'Google', 'Apple', 'Coca-Cola', 'Tesla', 'Johnson Controls', 'Microsoft'
];

const countries = ['United States', 'Canada', 'Mexico', 'Australia', 'New Zealand'];

const contactTypes = ['Commercial', 'Operational', 'Client Specific'];

const titles = ['Manager', 'Director', 'Supervisor', 'Coordinator', 'Specialist', 'Consultant'];

const contactFirstNames = ['John', 'Jane', 'Bob', 'Alice', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Jennifer'];
const contactLastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];

const regions = [
  'New York, NY, United States', 'Los Angeles, CA, United States', 'Toronto, ON, Canada', 'Vancouver, BC, Canada',
  'Mexico City, DF, Mexico', 'Sydney, NSW, Australia', 'Melbourne, VIC, Australia', 'Auckland, NZ, New Zealand',
  'Chicago, IL, United States', 'Houston, TX, United States'
];

let contactsData = [];

// Generate 50 contacts
for (let i = 0; i < 50; i++) {
  const supplierName = supplierNames[i % supplierNames.length];
  const contactFirstName = contactFirstNames[i % contactFirstNames.length];
  const contactLastName = contactLastNames[i % contactLastNames.length];
  const contactName = `${contactFirstName} ${contactLastName}`;
  const emailDomain = supplierName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '') + '.com';
  const email = `${contactFirstName.toLowerCase()}.${contactLastName.toLowerCase()}@${emailDomain}`;
  const phone = '555' + Math.floor(1000000 + Math.random() * 9000000).toString();
  const contactType = contactTypes[i % contactTypes.length];
  const client = contactType === 'Client Specific' ? clientNames[i % clientNames.length] : '';
  const supplierType = i < 26 ? 'OEM' : ['Repair', 'Storage', 'Transportation', 'Inspection', 'Title and Registration', 'Upfit', 'Resale'][i % 7];
  const contact = {
    contactName: contactName,
    title: titles[i % titles.length],
    contactType: contactType,
    supplierName: supplierName,
    supplierType: supplierType,
    client: client,
    region: regions[i % regions.length],
    email: email,
    phone: phone,
    hasUnreadMessage: i === 0, // Only the first record has unread message
    pastMessagesAvailable: i === 0 // Only the first record has past messages
  };
  contactsData.push(contact);
}

// DOM Elements
const contactsTableBody = document.querySelector('#contacts-table tbody');
const searchInput = document.getElementById('search-input');
const selectAllCheckbox = document.getElementById('select-all');
const composeButton = document.getElementById('compose-button');
const composeModal = document.getElementById('compose-modal');
const closeComposeButton = document.getElementById('close-compose');
const selectedContactsDiv = document.getElementById('selected-contacts');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const sendMethodSelect = document.getElementById('send-method');

// Selected Contacts
let selectedContacts = [];

// Render Contacts Table
function renderContactsTable() {
  const filteredContacts = contactsData.filter(contact => {
    const searchTerm = searchInput.value.toLowerCase();
    const matchesSearch = contact.contactName.toLowerCase().includes(searchTerm) ||
      contact.supplierName.toLowerCase().includes(searchTerm) ||
      contact.client.toLowerCase().includes(searchTerm);

    // Filters
    const selectedCountries = Array.from(document.querySelectorAll('input[name="country"]:checked')).map(el => el.value);
    const selectedSupplierTypes = Array.from(document.querySelectorAll('input[name="supplierType"]:checked')).map(el => el.value);
    const selectedContactTypes = Array.from(document.querySelectorAll('input[name="contactType"]:checked')).map(el => el.value);

    const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(contact.region.split(', ')[2]);
    const matchesSupplierType = selectedSupplierTypes.length === 0 || selectedSupplierTypes.includes(contact.supplierType);
    const matchesContactType = selectedContactTypes.length === 0 || selectedContactTypes.includes(contact.contactType);

    return matchesSearch && matchesCountry && matchesSupplierType && matchesContactType;
  });

  contactsTableBody.innerHTML = '';

  filteredContacts.forEach((contact, index) => {
    const row = document.createElement('tr');

    // Select Checkbox
    const selectCell = document.createElement('td');
    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.dataset.index = index;
    selectCheckbox.checked = selectedContacts.includes(index);
    selectCheckbox.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index);
      if (e.target.checked) {
        selectedContacts.push(idx);
      } else {
        selectedContacts = selectedContacts.filter(i => i !== idx);
      }
      updateComposeButtonState();
    });
    selectCell.appendChild(selectCheckbox);
    row.appendChild(selectCell);

    // Contact Name
    const contactNameCell = document.createElement('td');
    contactNameCell.textContent = contact.contactName;
    row.appendChild(contactNameCell);

    // Title
    const titleCell = document.createElement('td');
    titleCell.textContent = contact.title;
    row.appendChild(titleCell);

    // Supplier Name
    const supplierCell = document.createElement('td');
    const supplierLink = document.createElement('a');
    supplierLink.href = '#';
    if (contact.supplierName === "General Motors") {
      supplierLink.href = "profile/general-motors.html";
    }
    if (contact.supplierName === "RapidRepair Inc.") {
      supplierLink.href = "profile/rapidrepair.html";
    }
    supplierLink.textContent = contact.supplierName;
    supplierLink.style.color = '#22aaff';
    supplierLink.style.textDecoration = 'none';
    supplierCell.appendChild(supplierLink);
    row.appendChild(supplierCell);

    // Contact Type
    const contactTypeCell = document.createElement('td');
    contactTypeCell.textContent = contact.contactType;
    row.appendChild(contactTypeCell);

    // Client
    const clientCell = document.createElement('td');
    clientCell.textContent = contact.client;
    row.appendChild(clientCell);

    // Region
    const regionCell = document.createElement('td');
    regionCell.textContent = contact.region;
    row.appendChild(regionCell);

    // Email
    const emailCell = document.createElement('td');
    emailCell.textContent = contact.email;
    row.appendChild(emailCell);

    // Phone
    const phoneCell = document.createElement('td');
    phoneCell.textContent = contact.phone;
    row.appendChild(phoneCell);

    // Past Messages
    const messagesCell = document.createElement('td');
    if (contact.pastMessagesAvailable) {
      const messagesButton = document.createElement('button');
      messagesButton.innerHTML = '<i class="fa fa-comments"></i>';
      messagesButton.addEventListener('click', () => {
        selectedContacts = [index];
        updateComposeButtonState();
        openComposeModal();
      });
      messagesCell.appendChild(messagesButton);
    }
    row.appendChild(messagesCell);

    // Unread Message Indicator
    const unreadCell = document.createElement('td');
    if (contact.hasUnreadMessage) {
      const unreadDot = document.createElement('span');
      unreadDot.className = 'unread-dot';
      unreadCell.appendChild(unreadDot);
    }
    row.appendChild(unreadCell);

    contactsTableBody.appendChild(row);
  });
}

// Update Compose Button State
function updateComposeButtonState() {
  composeButton.disabled = selectedContacts.length === 0;
  // Update select-all checkbox
  const allCheckboxes = document.querySelectorAll('#contacts-table tbody input[type="checkbox"]');
  selectAllCheckbox.checked = selectedContacts.length === allCheckboxes.length && allCheckboxes.length > 0;
}

// Event Listeners
searchInput.addEventListener('input', renderContactsTable);
selectAllCheckbox.addEventListener('change', (e) => {
  const allCheckboxes = document.querySelectorAll('#contacts-table tbody input[type="checkbox"]');
  allCheckboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
    const idx = parseInt(checkbox.dataset.index);
    if (e.target.checked) {
      if (!selectedContacts.includes(idx)) {
        selectedContacts.push(idx);
      }
    } else {
      selectedContacts = [];
    }
  });
  updateComposeButtonState();
});

composeButton.addEventListener('click', openComposeModal);
closeComposeButton.addEventListener('click', closeComposeModal);

// Filter Event Listeners
const filterInputs = document.querySelectorAll('#side-panel input[type="checkbox"]');
filterInputs.forEach(input => {
  input.addEventListener('change', renderContactsTable);
});

function openComposeModal() {
  composeModal.style.display = 'block';
  // Display selected contacts
  selectedContactsDiv.innerHTML = '';
  selectedContacts.forEach(idx => {
    const contact = contactsData[idx];
    const chip = document.createElement('div');
    chip.className = 'contact-chip';
    chip.textContent = `${contact.contactName} - ${contact.contactType} - ${contact.supplierName}`;
    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-contact';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      selectedContacts = selectedContacts.filter(i => i !== idx);
      updateComposeButtonState();
      if (selectedContacts.length === 0) {
        closeComposeModal();
      } else {
        openComposeModal();
      }
    });
    chip.appendChild(removeBtn);
    selectedContactsDiv.appendChild(chip);
  });

  // Load chat history if only one contact is selected and has past messages
  chatContainer.innerHTML = '';
  if (selectedContacts.length === 1 && contactsData[selectedContacts[0]].pastMessagesAvailable) {
    loadChatHistory();
  }
}

function closeComposeModal() {
  composeModal.style.display = 'none';
  messageInput.value = '';
}

function loadChatHistory() {
  const messages = [
{ sender: 'You', timestamp: '2023-10-01 09:00 AM', message: 'Good morning, could you provide an update on the delivery status of our fleet vehicles?' },
  { sender: contactsData[selectedContacts[0]].contactName, timestamp: '2023-10-01 09:15 AM', message: 'Good morning, the vehicles are scheduled to be delivered by the end of next week.' },
  { sender: 'You', timestamp: '2023-10-01 09:20 AM', message: 'Thats great to hear. Are there any potential delays we should be aware of?' },
  { sender: contactsData[selectedContacts[0]].contactName, timestamp: '2023-10-01 09:25 AM', message: 'At this time, we do not anticipate any delays, but will keep you updated if anything changes.' },
  { sender: 'You', timestamp: '2023-10-01 09:30 AM', message: 'Thank you for the information. Please let me know once the delivery is confirmed.' },
  { sender: contactsData[selectedContacts[0]].contactName, timestamp: '2023-10-01 09:35 AM', message: 'Will do. Thank you for your patience.' }
  ];
  messages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.classList.add(msg.sender === 'You' ? 'right' : 'left');
    msgDiv.innerHTML = `<span class="sender">${msg.sender}</span><span class="timestamp">${msg.timestamp}</span><p>${msg.message}</p>`;
    chatContainer.appendChild(msgDiv);
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message === '') return;

  const msgDiv = document.createElement('div');
  const timestamp = new Date().toLocaleString();
  msgDiv.className = 'chat-message right';
  msgDiv.innerHTML = `<span class="sender">You</span><span class="timestamp">${timestamp}</span><p>${message}</p>`;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  messageInput.value = '';
});

window.onclick = function(event) {
  if (event.target == composeModal) {
    closeComposeModal();
  }
}

// Initial Render
renderContactsTable();
updateComposeButtonState();
