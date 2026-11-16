# User Guide - Targeted Courses & Learning Documents System

## Overview

This guide explains how the new **Targeted Courses & Learning Documents** system works for teachers and students.

---

## For Teachers

### Creating a Targeted Course

#### Step 1: Create the Course
1. Go to **Enseignant → Mes Cours**
2. Click **"Créer un cours"** (or similar button)
3. Fill in course details:
   - **Nom**: Course name (e.g., "Algorithme I")
   - **Code**: Unique course code (e.g., "ALG101")
   - **Description**: Course description
   - **Parcours cible** (Target Program): Select program (e.g., "Informatique")
   - **Niveau cible** (Target Level): Select level (e.g., "L1", "L2")
4. Click **"Créer"**

**Result**: Course is created and automatically available to students matching the target program/level.

#### Step 2: Upload Documents to Course
1. Go to **Enseignant → Documents**
2. Select the course from dropdown
3. Choose document upload method:
   - **Drag & drop**: Drag files into the upload area
   - **Click to browse**: Click and select files from computer
4. Supported formats:
   - PDF documents
   - Word documents (.docx, .doc)
   - Images (.png, .jpg, .jpeg)
   - Text files (.txt)
   - Spreadsheets (.xlsx, .xls)
5. Click **"Télécharger"** or drop files

**Result**: Document is uploaded and associated with the course. Status changes from "Téléversé" → "Traité" → "Traité" once processed.

#### Step 3: Verify Document Association
1. In **Documents** page, you'll see:
   - Document name
   - File size
   - Course code (confirms it's linked to the right course)
   - Upload status

**Result**: Document is now available to all students targeted to that course.

---

## For Students

### Accessing Targeted Courses

#### Step 1: View Your Courses
1. Go to **Étudiant → Mes cours**
2. You'll see a list of all courses targeted to you
3. Courses appear because:
   - Your program and level match the course's target program/level
   - OR you were explicitly enrolled by the teacher

**What You See**:
- Course name and code
- Teacher's name
- Progress bar (if applicable)
- "Continuer l'apprentissage" (Continue Learning) button

#### Step 2: Start Learning - Open Course
1. Click **"Continuer l'apprentissage"** button on a course card
2. You'll be taken to the **Course Detail Page**

**What You'll See**:
- Full course name and description
- Teacher information
- Metadata (creation date, document count)
- List of all documents for this course

#### Step 3: View Available Documents
The documents section shows:
- **Document name** (e.g., "Introduction-Algorithmes.pdf")
- **File size** (e.g., "2.0 MB")
- **Upload date** (e.g., "20 août 2026")
- **Status badge**:
  - 🟢 **Prêt** (Ready) = Can read/download
  - 🟡 **En cours...** (Processing) = Being analyzed
  - 🔴 **Erreur** (Error) = Processing failed
  - ⚪ **Téléversé** (Uploaded) = Waiting to process

#### Step 4: Read a Document
**For viewable formats** (PDF, images, plain text):
1. Click the **"Lire"** (View) button on the document
2. A modal window opens showing the document
3. For PDFs: You can scroll, zoom, navigate pages
4. For images: You can view the image clearly
5. For text: You can read the content
6. Click **"Télécharger"** from the modal to download
7. Click **"Fermer"** to close the viewer

**Example**: 
- You're reading "Introduction-Algorithmes.pdf" directly in your browser
- No download needed if just reading
- Can download if you want to keep a copy

#### Step 5: Download a Document
**For any document format**:
1. Click the **"Télécharger"** (Download) button
2. File automatically downloads to your downloads folder
3. File keeps its original name (e.g., "Introduction-Algorithmes.pdf")

**Example**:
- You download "TD-Algorithme.docx"
- You can open it in Microsoft Word or similar programs

### What if There Are No Documents?
- Course detail page shows: **"Aucun document disponible"**
- This means the teacher hasn't uploaded documents yet
- Check back later - documents may be added
- You can still access the course and see when it was created

### What if There Are Multiple Documents?
- All documents appear in a list
- You can view/download each one independently
- Different file types are shown with different icons:
  - 📄 PDF files (red icon)
  - 📊 Word documents (blue icon)
  - 🖼️ Images (green icon)
  - 📑 Other files (gray icon)

---

## How It Works - Behind the Scenes

### The Flow: From Teacher to Student

```
TEACHER SIDE:
1. Creates course with target program/level
   ↓
2. Uploads documents to the course
   ↓
3. Documents are processed by AI system
   ↓
4. Documents ready for students

STUDENT SIDE:
1. Logs in and sees "Mes cours"
   ↓
2. Courses appear because they match student's profile
   ↓
3. Clicks "Continue Learning"
   ↓
4. Sees course detail page with all documents
   ↓
5. Can read or download documents
```

### Student Targeting (Why You See Certain Courses)

You see a course if:
- **Program Match**: Your program field = Course's target program
- **AND Level Match**: Your level field = Course's target level

**Example**:
- Your Profile: Program="Informatique", Level="L1"
- Course A: Target="Informatique", Target Level="L1" → ✅ You see it
- Course B: Target="Informatique", Target Level="L2" → ❌ You don't see it
- Course C: Target="Mathématiques", Target Level="L1" → ❌ You don't see it

### Document Association

Each document is tied to exactly one course:
- When teacher uploads to a course, document gets course ID
- When student accesses course, they see all associated documents
- When student accesses different course, they see that course's documents
- Students **cannot** see documents from courses not targeted to them

---

## Troubleshooting

### Issue: I Don't See My Course
**Possible Causes**:
1. Your program/level doesn't match course target
2. Teacher hasn't published the course yet
3. You're logged in with wrong account

**Solution**:
1. Check your profile (Étudiant → Profil): program and level
2. Check course details: teacher's target program/level
3. Ask teacher if course is published
4. Try logging out and back in

### Issue: Course Exists But No Documents
**This is normal!** 
- Teacher may still be uploading documents
- Some courses start without materials
- Check back later

### Issue: "Lire" (View) Button Doesn't Work
**Possible Causes**:
1. Document is still processing (status = "En cours...")
2. File format not supported by viewer (DOCX, XLSX, etc.)
3. Browser doesn't support the file type

**Solution**:
1. Wait a few minutes if still processing
2. Use the "Télécharger" (Download) button instead
3. Open downloaded file in appropriate software

### Issue: Download Doesn't Work
**Possible Causes**:
1. Browser blocked the download
2. File no longer exists on server
3. Permissions issue

**Solution**:
1. Check browser settings for downloads
2. Try again in a few minutes
3. Contact support if persists

### Issue: Can't Access Course at All
**Cause**: You likely don't have permission

**Solution**:
- The course isn't targeted to your program/level
- Ask your teacher to check the course targeting settings

---

## Tips & Best Practices

### For Teachers:
1. **Always set target program/level** when creating courses
2. **Upload documents early** - students expect them
3. **Use clear file names** - helps students find documents (e.g., "01-Introduction.pdf" not "file1.pdf")
4. **Check document status** - wait for "Prêt" before announcing course
5. **Organize by chapters** - upload documents in logical order

### For Students:
1. **Check courses regularly** - new documents are added throughout the term
2. **Download important materials** - don't rely only on browser viewer
3. **Read descriptions** - understand what each document covers
4. **Give feedback** - let teachers know if documents are helpful
5. **Download before exams** - ensure you have all materials offline

---

## Features & Capabilities

### What You Can Do:
✅ View courses targeted to your program/level
✅ Access all documents for a course
✅ View PDFs inline (no download needed)
✅ View images inline
✅ Download any document
✅ View document information (size, date, status)
✅ Return to course list anytime
✅ Access course anytime (no time limits)

### What You Can't Do:
❌ Upload documents (teachers only)
❌ Delete documents (teachers only)
❌ Change course targeting (teachers only)
❌ Access courses not targeted to you
❌ Access documents from other students' courses
❌ Edit documents (teachers only)
❌ Share documents publicly

---

## File Types Guide

### View Directly (In Browser)
📄 **PDF Files** (.pdf)
- Full PDF viewing experience
- Can zoom, scroll, navigate pages
- Takes a moment to load for large files

🖼️ **Images** (.jpg, .png, .jpeg)
- View clearly in modal
- Can be zoomed
- Quick to load

📝 **Text Files** (.txt)
- View plain text content
- Good for notes and simple documents

### Download Only (Open Locally)
📊 **Word Documents** (.doc, .docx)
- Download and open in Microsoft Word or LibreOffice
- Preserves formatting

📑 **Excel Spreadsheets** (.xls, .xlsx)
- Download and open in Microsoft Excel or LibreOffice Calc
- View with formulas

🎬 **Other Formats** (.pptx, .zip, etc.)
- Download and open with appropriate software

---

## Getting Help

### Questions About Your Courses:
- Ask your teacher during class
- Email your teacher
- Check course announcements

### Technical Issues:
- Check this guide first
- Contact platform support
- Provide: course name, document name, error message

### Feature Requests:
- Contact your school's IT department
- Provide: detailed description, use case

---

## Summary

The **Targeted Courses & Learning Documents** system makes it easy for:
- **Teachers** to create targeted courses and share documents
- **Students** to find their courses and access learning materials

**In 3 steps**:
1. Teachers create course with target audience
2. Teachers upload documents
3. Students access via "Continuer l'apprentissage" button

Simple, secure, and effective! 🎓

---

*Last Updated: 2026-08-20*
*For more technical details, see IMPLEMENTATION_SUMMARY.md*
