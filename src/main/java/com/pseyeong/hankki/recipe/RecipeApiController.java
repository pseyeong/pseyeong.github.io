package com.pseyeong.hankki.recipe;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pseyeong.hankki.member.LoginUser;
import com.pseyeong.hankki.storage.SupabaseStorage;

import jakarta.validation.Valid;

/** 레시피 작성·수정·삭제 API. 로그인이 필요하고(SecurityConfig), 본인 레시피인지는 서비스가 다시 확인한다. */
@RestController
@RequestMapping("/api/recipes")
public class RecipeApiController {

	private final RecipeWriteService writeService;
	private final SupabaseStorage storage;

	public RecipeApiController(RecipeWriteService writeService, SupabaseStorage storage) {
		this.writeService = writeService;
		this.storage = storage;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Map<String, Long> create(@Valid @RequestBody RecipeForm form, @AuthenticationPrincipal LoginUser user) {
		return Map.of("id", writeService.create(user, form));
	}

	@PutMapping("/{id:\\d+}")
	public Map<String, Long> update(@PathVariable long id, @Valid @RequestBody RecipeForm form,
			@AuthenticationPrincipal LoginUser user) {
		List<String> unused = writeService.update(user, id, form);
		unused.forEach(storage::deleteQuietly);
		return Map.of("id", id);
	}

	@DeleteMapping("/{id:\\d+}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable long id, @AuthenticationPrincipal LoginUser user) {
		writeService.delete(user, id).forEach(storage::deleteQuietly);
	}
}
