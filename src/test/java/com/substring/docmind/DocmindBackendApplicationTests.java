package com.substring.docmind;

import com.substring.docmind.springai.TestService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DocmindBackendApplicationTests {


	@Autowired
	private TestService testService;

	@Test
	void testService() {

		testService.askAi();

	}

}
