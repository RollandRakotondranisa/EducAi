# Test Plan: Document View & Download Functionality

## Test Environment Setup

1. **Backend Running**: `npm start` (port 5000)
2. **Frontend Running**: `npm run dev` (port 5173)
3. **Database**: Connected and synced
4. **Test User Accounts**: Teacher and Student accounts created

---

## Test Scenarios

### Test 1: Basic PDF View & Download

**Setup**:
- Teacher: Create course "Test Course"
- Teacher: Upload a PDF document (e.g., "Sample.pdf")
- Student: Login with targeted account

**Test Steps**:

1. **Navigate to course**
   - Go to "Étudiant → Mes cours"
   - Click on "Test Course"
   - **Expected**: Course detail page loads

2. **View PDF Document**
   - Click "Lire" button on PDF document
   - **Expected**: 
     - Modal opens
     - PDF displays in iframe
     - Can scroll through pages
     - Browser PDF viewer controls visible
     - Document title shown in modal header

3. **Download PDF from Viewer**
   - Click "Télécharger" in modal footer
   - **Expected**:
     - Browser download dialog appears
     - File downloads as "Sample.pdf"
     - File is usable and readable

4. **Close and Download Again**
   - Close modal
   - Click "Télécharger" button on document card
   - **Expected**:
     - Browser download dialog appears
     - Same file downloads
     - No errors in console

**Pass Criteria**: All steps completed successfully, no console errors

---

### Test 2: Image File View & Download

**Setup**:
- Teacher: Upload image file (PNG or JPG) to course
- Student: Login

**Test Steps**:

1. **View Image**
   - Click "Lire" on image document
   - **Expected**:
     - Modal opens
     - Image displays clearly
     - Image fits in modal
     - Can scroll if needed

2. **Download Image**
   - Click "Télécharger"
   - **Expected**:
     - File downloads with original name
     - File is viewable image

**Pass Criteria**: Image displays and downloads correctly

---

### Test 3: Text File View

**Setup**:
- Teacher: Upload text file (.txt)
- Student: Login

**Test Steps**:

1. **View Text File**
   - Click "Lire"
   - **Expected**:
     - Modal opens
     - Text content displays
     - Readable and scrollable

2. **Download Text**
   - Click "Télécharger"
   - **Expected**:
     - File downloads

**Pass Criteria**: Text displays and downloads

---

### Test 4: Unsupported Format Download

**Setup**:
- Teacher: Upload Word document (.docx)
- Student: Login

**Test Steps**:

1. **Click "Lire"**
   - **Expected**:
     - Modal opens
     - Shows "Document non visualisable" message
     - Offers download button

2. **Download from Error State**
   - Click "Télécharger le document"
   - **Expected**:
     - File downloads with correct name

**Pass Criteria**: Graceful fallback to download

---

### Test 5: Multiple Documents

**Setup**:
- Teacher: Create course with 3 documents (PDF, image, Word)
- Student: Login

**Test Steps**:

1. **View Document List**
   - Navigate to course
   - **Expected**:
     - All 3 documents visible
     - Each has appropriate icon
     - File sizes showing correctly
     - Upload dates visible

2. **View Each Document**
   - Click "Lire" on PDF → displays ✓
   - Click "Lire" on image → displays ✓
   - Click "Lire" on Word → shows error, offers download ✓

3. **Download All**
   - Download each document
   - **Expected**:
     - All files download successfully
     - Filenames preserved

**Pass Criteria**: All documents accessible as expected

---

### Test 6: Access Control - Unauthorized Student

**Setup**:
- Course created for Program="Informatique", Level="L1"
- Student account with Program="Mathématiques", Level="L1"

**Test Steps**:

1. **Try to Access Course**
   - Login as unauthorized student
   - Navigate to "Mes cours"
   - **Expected**:
     - Course NOT visible in list

2. **Try Direct Access**
   - Open browser console
   - Fetch: `/api/courses/{courseId}`
   - **Expected**:
     - Response: 403 Forbidden or 404

3. **Try Direct Document Download**
   - Fetch: `/api/documents/{documentId}/download`
   - **Expected**:
     - Response: 403 Forbidden
     - No file downloaded

**Pass Criteria**: Unauthorized access blocked

---

### Test 7: Authentication Required

**Setup**:
- Any course with documents

**Test Steps**:

1. **Logout** from system

2. **Try to View Document**
   - Open developer console
   - Fetch (no auth header): `/api/documents/{id}/download`
   - **Expected**:
     - Response: 401 Unauthorized

3. **Try Download**
   - Same as above
   - **Expected**:
     - Response: 401 Unauthorized

**Pass Criteria**: Unauthenticated access denied

---

### Test 8: Network Error Handling

**Setup**:
- Course with documents

**Test Steps**:

1. **Simulate Network Failure**
   - Open DevTools Network tab
   - Set throttle to "Offline"
   - Try to view document
   - **Expected**:
     - Error shown: "Impossible d'afficher ce document"
     - Fallback to download option

2. **Resume Network**
   - Turn network back on
   - Try again
   - **Expected**:
     - Document loads successfully

**Pass Criteria**: Graceful error handling

---

### Test 9: Large File Download

**Setup**:
- Upload larger PDF (5-10 MB)

**Test Steps**:

1. **Download Large File**
   - Click "Télécharger"
   - **Expected**:
     - Download dialog appears
     - Progress shows (if applicable)
     - File completes download
     - No timeout errors

2. **View Large PDF**
   - Click "Lire"
   - **Expected**:
     - Loading indicator shown
     - PDF loads (may take a moment)
     - Viewer works correctly

**Pass Criteria**: Large files handled properly

---

### Test 10: Empty Course

**Setup**:
- Create course but don't upload documents

**Test Steps**:

1. **Navigate to Empty Course**
   - Student views course
   - **Expected**:
     - "Aucun document disponible" message
     - No errors
     - Back button works

**Pass Criteria**: Empty state handled gracefully

---

## Console Checks

For each test, verify console has NO errors related to:
- ❌ `Failed to load document`
- ❌ `Download error`
- ❌ `Cannot read property 'id'`
- ❌ `Unauthorized`
- ❌ CORS errors
- ❌ 403/404/401 errors (except in auth tests)

---

## Performance Checks

### Load Time
- Document list loads in < 2s
- PDF viewer modal appears in < 3s
- Download starts within 1s

### Memory
- Blob URLs properly cleaned up
- No memory leak when viewing/downloading multiple documents
- DevTools Memory tab shows stable memory

### Network
- Only 1 fetch per document view
- Only 1 fetch per document download
- Proper caching (if implemented)

---

## Regression Tests

Verify existing functionality still works:

1. **Course Creation** - Can still create courses ✓
2. **Course Targeting** - Students still see only targeted courses ✓
3. **Document Upload** - Teachers can still upload ✓
4. **Course Deletion** - Can delete courses ✓
5. **Document Deletion** - Can delete documents ✓
6. **Student Enrollment** - Enrollment still works ✓

---

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors
✅ All error cases handled gracefully
✅ Access control enforced
✅ No memory leaks
✅ Performance acceptable
✅ Existing functionality preserved

---

## Bug Report Template

If any test fails:

```
Test Number: [e.g., Test 1]
Issue: [What didn't work]
Expected: [What should happen]
Actual: [What actually happened]
Steps to Reproduce: [1, 2, 3...]
Console Errors: [If any]
Screenshot: [If applicable]
Browser: [Chrome/Firefox/Safari]
Device: [Desktop/Mobile]
```

---

## Sign-Off

**Tester**: _______________
**Date**: _______________
**All Tests Passed**: ☐ YES  ☐ NO
**Comments**: ___________________________________

---

*Ready for production after all tests pass* ✅
