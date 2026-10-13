package com.pseyeong.hankki.recipe;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pseyeong.hankki.common.web.ApiException;
import com.pseyeong.hankki.ingredient.IngredientRepository;
import com.pseyeong.hankki.member.LoginUser;
import com.pseyeong.hankki.recipe.RecipeWriteRepository.EditRow;
import com.pseyeong.hankki.storage.SupabaseStorage;

/**
 * 레시피 작성·수정·삭제.
 * - 작성자 본인만 수정·삭제할 수 있다 (관리자는 전체). 화면에서 버튼을 숨기는 것과 별개로 여기서 막는다.
 * - 재료·사진 주소는 브라우저가 보낸 값을 믿지 않고 다시 검사한다.
 * - 저장하면 DB 트리거와 recalcPrice 가 price_per_serving, is_partial_price 를 계산해 넣는다.
 */
@Service
public class RecipeWriteService {

	public static final Set<String> TOOLS = Set.of("프라이팬", "냄비", "전자레인지", "에어프라이어");

	private final RecipeWriteRepository repository;
	private final IngredientRepository ingredientRepository;
	private final SupabaseStorage storage;

	public RecipeWriteService(RecipeWriteRepository repository, IngredientRepository ingredientRepository,
			SupabaseStorage storage) {
		this.repository = repository;
		this.ingredientRepository = ingredientRepository;
		this.storage = storage;
	}

	@Transactional
	public long create(LoginUser user, RecipeForm form) {
		validate(user, form, Set.of());
		long id = repository.insertRecipe(user.id(), form);
		repository.replaceIngredients(id, form.ingredients());
		repository.replaceSteps(id, form.steps());
		repository.recalcPrice(id);
		return id;
	}

	/** @return 수정으로 쓰이지 않게 된 사진 주소들 (호출한 쪽이 저장소에서 지운다) */
	@Transactional
	public List<String> update(LoginUser user, long id, RecipeForm form) {
		EditRow recipe = loadModifiable(user, id);
		Set<String> before = new HashSet<>(repository.findImages(id));
		validate(user, form, before);

		repository.updateRecipe(id, form);
		repository.replaceIngredients(id, form.ingredients());
		repository.replaceSteps(id, form.steps());
		repository.recalcPrice(id);

		// 수정으로 빠진 사진 중 다른 레시피가 쓰지 않는 것만 지운다
		Set<String> after = images(form);
		return before.stream().filter(url -> !after.contains(url)).filter(url -> !repository.isImageInUse(url)).toList();
	}

	/** @return 지워야 할 사진 주소들 */
	@Transactional
	public List<String> delete(LoginUser user, long id) {
		loadModifiable(user, id);
		List<String> images = repository.findImages(id);
		repository.delete(id);
		return images.stream().distinct().filter(url -> !repository.isImageInUse(url)).toList();
	}

	/** 수정 화면을 열 수 있는지 확인하고 레시피를 돌려준다 */
	@Transactional(readOnly = true)
	public EditRow loadForEdit(LoginUser user, long id) {
		return loadModifiable(user, id);
	}

	private EditRow loadModifiable(LoginUser user, long id) {
		EditRow recipe = repository.findForEdit(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "레시피를 찾을 수 없어요."));
		boolean owner = recipe.authorId() != null && recipe.authorId().equals(user.id());
		if (!owner && !user.isAdmin()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "내가 쓴 레시피만 수정할 수 있어요.");
		}
		return recipe;
	}

	/**
	 * @param ownImages 이 레시피가 이미 쓰고 있는 사진. 다른 회원이 올린 사진이라도 이미 이 레시피의 것이면 유지할 수 있다.
	 */
	private void validate(LoginUser user, RecipeForm form, Set<String> ownImages) {
		Map<String, String> errors = new LinkedHashMap<>();

		if (!TOOLS.contains(form.tool())) {
			errors.put("tool", "조리도구를 골라 주세요.");
		}

		List<Long> ids = new ArrayList<>();
		for (int i = 0; i < form.ingredients().size(); i++) {
			RecipeForm.Ingredient ingredient = form.ingredients().get(i);
			if (ingredient.isCustom()) {
				if (ingredient.customName() == null || ingredient.customName().isBlank()) {
					errors.putIfAbsent("ingredients[" + i + "].customName", "재료 이름을 적어 주세요.");
				}
			}
			else {
				ids.add(ingredient.ingredientId());
				if (ingredient.quantity() == null) {
					errors.putIfAbsent("ingredients[" + i + "].quantity", "사용량을 적어 주세요.");
				}
			}
		}
		Set<Long> distinct = new HashSet<>(ids);
		if (!new HashSet<>(ingredientRepository.findExistingIds(distinct)).equals(distinct)) {
			errors.put("ingredients", "목록에 없는 재료가 섞여 있어요. 다시 골라 주세요.");
		}

		checkImage(form.coverImage(), user, ownImages, "coverImage", errors);
		for (int i = 0; i < form.steps().size(); i++) {
			checkImage(form.steps().get(i).image(), user, ownImages, "steps[" + i + "].image", errors);
		}

		if (!errors.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "입력값을 확인해 주세요.", errors);
		}
	}

	/** 우리 저장소에 내가 올린 사진(또는 이 레시피가 원래 쓰던 사진)만 허용한다 */
	private void checkImage(String url, LoginUser user, Set<String> ownImages, String field, Map<String, String> errors) {
		if (url == null || url.isBlank()) {
			return;
		}
		String trimmed = url.trim();
		if (ownImages.contains(trimmed)) {
			return;
		}
		UUID owner = storage.ownerOf(trimmed).orElse(null);
		if (owner == null || !owner.equals(user.id())) {
			errors.putIfAbsent(field, "사진을 다시 올려 주세요.");
		}
	}

	private static Set<String> images(RecipeForm form) {
		Set<String> urls = new HashSet<>();
		if (form.coverImage() != null && !form.coverImage().isBlank()) {
			urls.add(form.coverImage().trim());
		}
		form.steps().stream().map(RecipeForm.Step::image).filter(Objects::nonNull)
				.filter(s -> !s.isBlank()).map(String::trim).forEach(urls::add);
		return urls;
	}
}
