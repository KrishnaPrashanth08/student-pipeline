import axios from "axios";

export const handler = async (event: any) => {
  try {

    if (event.simulateFailure === "Service2") {
      throw new Error("Simulated Service2 failure for testing");
    }

    if (event.restoreCount > 0) {
      console.log(`Service2 restore attempt #${event.restoreCount}`);
    }

    if (!event.is_valid) {
      throw new Error("Invalid student data");
    }

    // Call mock API for grade conversion
    const response = await axios.post(
      process.env.MOCK_API2_URL!, 
      { marks: event.marks }
    );

    const gpa = parseFloat(response.data.gpa);
    const letter_grade = response.data.letter_grade;
    
    // Add cutoff logic - fail if GPA < 2.5 or marks < 60
    const GRADE_CUTOFF = 6.0;
    const MARKS_CUTOFF = 60;
    
    const passesGrade = gpa >= GRADE_CUTOFF && event.marks >= MARKS_CUTOFF;
    
    return {
      ...event,
      gpa,
      letter_grade,
      grade_check_passed: passesGrade, // Key field for choice state
      cutoff_reason: passesGrade ? null : `GPA ${gpa} below ${GRADE_CUTOFF} or marks ${event.marks} below ${MARKS_CUTOFF}`
    };

  } catch (error) {
    console.error("Grade conversion failed:", error);
    throw error;
  }
};
