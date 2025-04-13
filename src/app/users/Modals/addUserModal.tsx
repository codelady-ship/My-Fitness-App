// components/userModals/addUserModal.ts
import Swal from "sweetalert2";

export const showAddUserModal = (
  setCards: (cards: any[]) => void,
  cards: any[],
  darkMode: boolean
) => {
  Swal.fire({
    title: 'Add New User',
    html: `
      <div style="display: grid; gap: 15px; padding: 20px; max-width: 400px; margin: 0 auto;">
        <!-- Avatar Preview and Upload -->
        <div style="text-align: center;">
          <label for="imageUpload" style="display: block; cursor: pointer;">
            <img 
              id="avatarPreview" 
              src="/default-avatar.jpg" 
              alt="Add photo" 
              style="width: 120px; height: 120px; object-fit: cover; border: 2px solid #ccc; margin-left: 120px;" 
            />
          </label>
          <input 
            type="file" 
            id="imageUpload" 
            accept="image/*" 
            class="swal2-input swal-form-input" 
            style="display: none;" 
          />
        </div>
        
        <!-- User Info Inputs -->
        <input type="text" id="fullName" class="swal2-input" placeholder="Full Name" required />
        <input type="email" id="email" class="swal2-input" placeholder="Email" required />
        <input type="number" id="height" class="swal2-input" placeholder="Height (cm)" required />
        <input type="number" id="weight" class="swal2-input" placeholder="Weight (kg)" required />
        <input type="text" id="goals" class="swal2-input" placeholder="Goals" required />
      </div>
    `,
    preConfirm: () => {
      const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const height = parseInt((document.getElementById('height') as HTMLInputElement).value);
      const weight = parseInt((document.getElementById('weight') as HTMLInputElement).value);
      const goals = (document.getElementById('goals') as HTMLInputElement).value;

      // Image File Handling
      const imageInput = document.getElementById('imageUpload') as HTMLInputElement;
      let image = '/default-avatar.jpg'; // Default image
      if (imageInput?.files?.length) {
        const file = imageInput.files[0];
        // Read image as base64
        const reader = new FileReader();
        reader.onload = () => {
          image = reader.result as string;
          // Update the avatar preview dynamically
          const avatarPreview = document.getElementById('avatarPreview') as HTMLImageElement;
          avatarPreview.src = image;
        };
        reader.readAsDataURL(file);
      }

      // Validation check
      if (!fullName || !email || !height || !weight || !goals) {
        Swal.showValidationMessage('Please fill in all fields');
        return false;
      }

      const newCard = {
        id: "C" + Math.floor(Math.random() * 1000000),
        owner: fullName,
        image: image, // Store the image URL or base64 string
        remainingAccesses: 10,
        status: 'active',
        lastUsed: new Date().toISOString(),
        fullName: fullName,
        gender: 'male', // default value
        birthDate: '1990-01-01',
        email: email,
        phone: '+994500000000', // default phone number
        membershipType: 'Year',
        startDate: '2025-04-01',
        endDate: '2026-04-01',
        lastVisit: new Date().toISOString(),
        height: height,
        weight: weight,
        goals: goals,
        coach: 'Coach Name',
        checkInHistory: [],
        notes: '',
        isBlacklisted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new user to the cards state
      setCards([...cards, newCard]);
    },
    customClass: {
      popup: darkMode ? 'swal-dark' : '',
    },
    confirmButtonText: 'Add User',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
  });
};
