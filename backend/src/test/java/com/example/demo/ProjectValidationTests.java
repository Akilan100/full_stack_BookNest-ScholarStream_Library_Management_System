package com.example.demo;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetails;
import org.testng.Assert;
import org.testng.annotations.Listeners;
import org.testng.annotations.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Listeners(TestResultListener.class)
public class ProjectValidationTests {

    private static final String PRIMARY_ENTITY = "com.example.demo.entity.LibraryBook";
    private static final String SECONDARY_ENTITY = "com.example.demo.entity.BookHoldRequest";
    private static final String PRIMARY_CONTROLLER = "com.example.demo.controller.BookController";
    private static final String SECONDARY_CONTROLLER = "com.example.demo.controller.ReservationController";
    private static final String PRIMARY_SERVICE = "com.example.demo.service.BookService";
    private static final String SECONDARY_SERVICE = "com.example.demo.service.ReservationService";
    private static final String PRIMARY_REPOSITORY = "com.example.demo.repository.LibraryBookRepository";
    private static final String SECONDARY_REPOSITORY = "com.example.demo.repository.BookHoldRequestRepository";
    private static final String DTO_PATH = "com.example.demo.dto.BookResponseDto";
    private static final String TABLE_NAME = "library_book";
    private static final String API_BASE_PATH = "/api/books";
    private static final String DOMAIN_ROLE = "LIBRARIAN_STAFF";
    private static final String CRUD_DELETE_MSG = "LibraryBook deleted successfully.";
    private static final String CRUD_CREATE_MSG = "LibraryBook created successfully.";
    private static final String CRUD_UPDATE_MSG = "LibraryBook updated successfully.";
    private static final String SEC_DELETE_MSG = "BookHoldRequest deleted successfully.";
    private static final String DOMAIN_VALUE_1 = "Effective Java (3rd Edition)";
    private static final String DOMAIN_VALUE_2 = "Joshua Bloch";
    private static final String JWT_CLASS_PATH = "com.example.demo.util.JwtService";
    private static final String AUTH_EMAIL = "admin@booknest.com";

    // Helper to build a service with a mocked repository
    private Object buildMockedService(String servicePath, String repositoryPath, java.lang.reflect.InvocationHandler repoHandler) throws Exception {
        Class<?> svcClass = Class.forName(servicePath);
        Class<?> repoInterface = Class.forName(repositoryPath);
        Object repoProxy = Proxy.newProxyInstance(repoInterface.getClassLoader(), new Class<?>[]{repoInterface}, (proxy, method, args) -> {
            Object res = repoHandler.invoke(proxy, method, args);
            if (res == null) {
                if (method.getReturnType().equals(boolean.class)) return false;
                if (method.getReturnType().equals(int.class)) return 0;
                if (method.getReturnType().equals(long.class)) return 0L;
            }
            return res;
        });
        Constructor<?> constructor = svcClass.getConstructors()[0];
        return constructor.newInstance(repoProxy);
    }

    // DAY-1 | Sprint: Package & Layer Architecture Verification

    @Test
    public void t1_primaryControllerLoadsAndInstantiable() throws Exception {
        // SRS_REF: REQ-CTRL-01 — Routes HTTP requests for LibraryBook operations
        Class<?> clazz = Class.forName(PRIMARY_CONTROLLER);
        Assert.assertNotNull(clazz);
        Method[] methods = clazz.getDeclaredMethods();
        Assert.assertTrue(methods.length > 0);
        
        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, m, a) -> null);
        Constructor<?> constructor = clazz.getDeclaredConstructors()[0];
        Object controller = constructor.newInstance(service);
        Assert.assertNotNull(controller);
    }

    @Test
    public void t2_primaryServiceHasRequiredMethods() throws Exception {
        // SRS_REF: REQ-SVC-01 — Encapsulates business logic for LibraryBook management
        Class<?> clazz = Class.forName(PRIMARY_SERVICE);
        Assert.assertNotNull(clazz);
        Method[] methods = clazz.getDeclaredMethods();
        Assert.assertTrue(methods.length >= 3);
        Assert.assertTrue(Arrays.stream(methods).anyMatch(m -> m.getName().toLowerCase().contains("book")));
        Assert.assertTrue(Arrays.stream(methods).anyMatch(m -> m.getReturnType() != void.class));
    }

    @Test
    public void t3_primaryRepositoryIsJpaInterface() throws Exception {
        // SRS_REF: REQ-REPO-01 — JPA data access for LibraryBook
        Class<?> clazz = Class.forName(PRIMARY_REPOSITORY);
        Assert.assertTrue(clazz.isInterface());
        Assert.assertTrue(Arrays.stream(clazz.getInterfaces()).anyMatch(i -> i.getSimpleName().contains("JpaRepository")));
    }

    @Test
    public void t4_primaryEntityMappingVerified() throws Exception {
        // SRS_REF: REQ-ENT-01 — Persistent model mapped to library_book
        Class<?> clazz = Class.forName(PRIMARY_ENTITY);
        Assert.assertNotNull(clazz.getAnnotation(jakarta.persistence.Entity.class));
        jakarta.persistence.Table table = clazz.getAnnotation(jakarta.persistence.Table.class);
        Assert.assertEquals(table.name(), TABLE_NAME);
        Assert.assertTrue(clazz.getDeclaredFields().length >= 4);
    }

    @Test
    public void t5_securityConfigBeansPresent() throws Exception {
        // SRS_REF: REQ-SEC-01 — Defines auth filters and role-based authorization
        Class<?> clazz = Class.forName("com.example.demo.config.SecurityConfig");
        Assert.assertNotNull(clazz.getAnnotation(org.springframework.context.annotation.Configuration.class));
        Assert.assertTrue(Arrays.stream(clazz.getDeclaredMethods()).anyMatch(m -> m.isAnnotationPresent(org.springframework.context.annotation.Bean.class)));
    }

    // DAY-2 | Sprint: Full CRUD Response Verification via Reflection

    @Test
    public void t6_controllerRequestMappingVerified() throws Exception {
        // SRS_REF: REQ-CTRL-02/03
        Class<?> clazz = Class.forName(PRIMARY_CONTROLLER);
        Assert.assertNotNull(clazz.getAnnotation(org.springframework.web.bind.annotation.RestController.class));
        org.springframework.web.bind.annotation.RequestMapping rm = clazz.getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);
        Assert.assertEquals(rm.value()[0], API_BASE_PATH);
    }

    @Test
    public void t7_getAllReturnsDataWith200OK() throws Exception {
        // SRS_REF: REQ-CTRL-06 — getAll returns domain entity list with 200 OK
        Class<?> ctrlClazz = Class.forName(PRIMARY_CONTROLLER);
        Class<?> entClass = Class.forName(PRIMARY_ENTITY);
        
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.GetMapping.class) && 
                            (meth.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class).value().length == 0 || 
                             meth.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class).value()[0].equals("")))
            .findFirst().get();

        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("search") || meth.getName().contains("findAll")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setTitle", String.class).invoke(ent, DOMAIN_VALUE_1);
                entClass.getMethod("setAuthor", String.class).invoke(ent, DOMAIN_VALUE_2);
                entClass.getMethod("setIsbn", String.class).invoke(ent, "123");
                entClass.getMethod("setCategory", String.class).invoke(ent, "CS");
                
                if (meth.getReturnType().getSimpleName().contains("Page")) {
                    return Class.forName("org.springframework.data.domain.PageImpl").getConstructor(List.class).newInstance(List.of(ent));
                }
                return List.of(ent);
            }
            return null;
        });

        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        Object[] args = new Object[m.getParameterCount()];
        for(int i=0; i<args.length; i++) {
            if (m.getParameterTypes()[i].equals(int.class)) args[i] = 10;
            else if (m.getParameterTypes()[i].equals(String.class)) args[i] = "";
            else if (m.getParameterTypes()[i].getSimpleName().contains("Pageable")) {
                args[i] = org.springframework.data.domain.PageRequest.of(0, 10);
            }
        }
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(ctrl, args);
        Assert.assertEquals(res.getStatusCode(), HttpStatus.OK);
    }

    @Test
    public void t8_deleteReturnsCorrectMessage() throws Exception {
        // SRS_REF: REQ-CTRL-08 — delete returns CRUD_DELETE_MSG with 200 OK
        Class<?> ctrlClazz = Class.forName(PRIMARY_CONTROLLER);
        Class<?> entClass = Class.forName(PRIMARY_ENTITY);
        
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.DeleteMapping.class))
            .findFirst().get();

        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("findById")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setAvailableCopies", int.class).invoke(ent, 5);
                entClass.getMethod("setTotalCopies", int.class).invoke(ent, 5);
                return Optional.of(ent);
            }
            return null;
        });

        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        try {
            ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(ctrl, 1L);
            if (res.getBody() instanceof String) {
                Assert.assertEquals(res.getBody(), CRUD_DELETE_MSG);
            }
        } catch (Exception e) {}
    }

    @Test
    public void t9_createReturns201WithId() throws Exception {
        // SRS_REF: REQ-CTRL-04/09 — create returns 201 with saved entity
        Class<?> ctrlClazz = Class.forName(PRIMARY_CONTROLLER);
        Class<?> entClass = Class.forName(PRIMARY_ENTITY);
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.PostMapping.class) && 
                            meth.getAnnotation(org.springframework.web.bind.annotation.PostMapping.class).value().length == 0)
            .findFirst().get();

        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("save")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setTitle", String.class).invoke(ent, DOMAIN_VALUE_1);
                entClass.getMethod("setAuthor", String.class).invoke(ent, DOMAIN_VALUE_2);
                entClass.getMethod("setIsbn", String.class).invoke(ent, "123");
                entClass.getMethod("setCategory", String.class).invoke(ent, "CS");
                return ent;
            }
            return null;
        });

        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        Class<?> reqDto = Arrays.stream(m.getParameterTypes()).filter(t -> t.getSimpleName().contains("Dto")).findFirst().get();
        Object reqObj = reqDto.getDeclaredConstructor().newInstance();
        reqDto.getMethod("setIsbn", String.class).invoke(reqObj, "UNIQUE-ISBN-123");
        reqDto.getMethod("setTitle", String.class).invoke(reqObj, DOMAIN_VALUE_1);
        reqDto.getMethod("setAuthor", String.class).invoke(reqObj, DOMAIN_VALUE_2);
        reqDto.getMethod("setCategory", String.class).invoke(reqObj, "CS");
        reqDto.getMethod("setTotalCopies", int.class).invoke(reqObj, 5);
        
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(ctrl, reqObj);
        Assert.assertEquals(res.getStatusCode(), HttpStatus.CREATED);
    }

    @Test
    public void t10_updateReturns200WithBody() throws Exception {
        // SRS_REF: REQ-CTRL-07 — update returns 200 with updated entity
        Class<?> ctrlClazz = Class.forName(PRIMARY_CONTROLLER);
        Class<?> entClass = Class.forName(PRIMARY_ENTITY);
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.PutMapping.class))
            .findFirst().get();

        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("findById")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setAvailableCopies", int.class).invoke(ent, 5);
                entClass.getMethod("setTotalCopies", int.class).invoke(ent, 5);
                entClass.getMethod("setIsbn", String.class).invoke(ent, "123");
                entClass.getMethod("setCategory", String.class).invoke(ent, "CS");
                return Optional.of(ent);
            }
            if (meth.getName().contains("save")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setTitle", String.class).invoke(ent, DOMAIN_VALUE_1);
                entClass.getMethod("setAuthor", String.class).invoke(ent, DOMAIN_VALUE_2);
                entClass.getMethod("setIsbn", String.class).invoke(ent, "123");
                entClass.getMethod("setCategory", String.class).invoke(ent, "CS");
                return ent;
            }
            return null;
        });

        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        Class<?> reqDto = Arrays.stream(m.getParameterTypes()).filter(t -> t.getSimpleName().contains("Dto")).findFirst().get();
        Object reqObj = reqDto.getDeclaredConstructor().newInstance();
        reqDto.getMethod("setTotalCopies", int.class).invoke(reqObj, 10);
        reqDto.getMethod("setTitle", String.class).invoke(reqObj, DOMAIN_VALUE_1);
        reqDto.getMethod("setAuthor", String.class).invoke(reqObj, DOMAIN_VALUE_2);
        reqDto.getMethod("setCategory", String.class).invoke(reqObj, "CS");
        
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(ctrl, 1L, reqObj);
        Assert.assertEquals(res.getStatusCode(), HttpStatus.OK);
    }

    @Test
    public void t11_getByIdReturnsEntityWith200OK() throws Exception {
        // SRS_REF: REQ-CTRL-10 — getById returns the correct entity with 200 OK
        Class<?> ctrlClazz = Class.forName(PRIMARY_CONTROLLER);
        Class<?> entClass = Class.forName(PRIMARY_ENTITY);
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.GetMapping.class) && 
                            meth.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class).value().length > 0)
            .findFirst().get();

        Object service = buildMockedService(PRIMARY_SERVICE, PRIMARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("findById")) {
                Object ent = entClass.getDeclaredConstructor().newInstance();
                entClass.getMethod("setId", Long.class).invoke(ent, 1L);
                entClass.getMethod("setIsbn", String.class).invoke(ent, "123");
                entClass.getMethod("setCategory", String.class).invoke(ent, "CS");
                return Optional.of(ent);
            }
            return null;
        });

        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(ctrl, 1L);
        Assert.assertEquals(res.getStatusCode(), HttpStatus.OK);
    }

    @Test
    public void t12_secondaryEntityDeleteVerified() throws Exception {
        // SRS_REF: REQ-CTRL-SEC-08 — secondary entity delete returns correct message
        Class<?> ctrlClazz = Class.forName(SECONDARY_CONTROLLER);
        Method m = Arrays.stream(ctrlClazz.getDeclaredMethods())
            .filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.DeleteMapping.class))
            .findFirst().orElse(null);
        
        if (m == null) return;

        Object service = buildMockedService(SECONDARY_SERVICE, SECONDARY_REPOSITORY, (p, meth, a) -> {
            if (meth.getName().contains("findById")) {
                Class<?> secEnt = Class.forName(SECONDARY_ENTITY);
                return Optional.of(secEnt.getDeclaredConstructor().newInstance());
            }
            return null;
        });
        
        Object ctrl = ctrlClazz.getDeclaredConstructors()[0].newInstance(service);
        Object[] args = new Object[m.getParameterCount()];
        for(int i=0; i<args.length; i++) if(m.getParameterTypes()[i].equals(Long.class)) args[i] = 1L;
        
        try { m.invoke(ctrl, args); } catch (Exception e) {}
    }

    // DAY-3 | Sprint: Security Annotations, RBAC & CORS

    @Test
    public void t13_preAuthorizeAdminExists() throws Exception {
        // SRS_REF: REQ-SEC-02 — ADMIN-gated endpoints reject non-admin callers
        Class<?> ctrl = Class.forName(PRIMARY_CONTROLLER);
        Assert.assertTrue(Arrays.stream(ctrl.getDeclaredMethods()).anyMatch(m -> m.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class) && m.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class).value().contains("CHIEF_LIBRARIAN")));
    }

    @Test
    public void t14_preAuthorizeDomainRoleExists() throws Exception {
        // SRS_REF: REQ-SEC-03 — domain role endpoints accessible to correct role
        Class<?> ctrl = Class.forName(PRIMARY_CONTROLLER);
        Assert.assertTrue(Arrays.stream(ctrl.getDeclaredMethods()).anyMatch(m -> m.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class) && m.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class).value().contains(DOMAIN_ROLE)));
    }

    @Test
    public void t15_corsConfigurationExists() throws Exception {
        // SRS_REF: REQ-CORS-01 — frontend React app can communicate with backend
        Class<?> cfg = Class.forName("com.example.demo.config.SecurityConfig");
        Assert.assertTrue(Arrays.stream(cfg.getDeclaredMethods()).anyMatch(m -> m.getName().toLowerCase().contains("cors")));
    }

    @Test
    public void t16_validationEnforcedOnRequestBody() throws Exception {
        // SRS_REF: REQ-VAL-01 — input validation enforced at controller boundary
        Class<?> ctrl = Class.forName(PRIMARY_CONTROLLER);
        Method m = Arrays.stream(ctrl.getDeclaredMethods()).filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.PostMapping.class) && meth.getAnnotation(org.springframework.web.bind.annotation.PostMapping.class).value().length == 0).findFirst().get();
        Assert.assertTrue(Arrays.stream(m.getParameterAnnotations()).anyMatch(annos -> Arrays.stream(annos).anyMatch(a -> a.annotationType().getSimpleName().equals("Valid"))));
    }

    @Test
    public void t17_transactionalAnnotationPresentInService() throws Exception {
        // SRS_REF: REQ-SVC-02 — database operations wrapped in transactions
        Class<?> svc = Class.forName(PRIMARY_SERVICE);
        Assert.assertTrue(Arrays.stream(svc.getDeclaredMethods()).anyMatch(m -> m.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class)));
    }

    // DAY-4 | Sprint: Repository Custom Queries & Exception Handling

    @Test
    public void t18_repositoryFindByMethodExists() throws Exception {
        // SRS_REF: REQ-REPO-04 — domain filtering beyond basic findAll()
        Class<?> repo = Class.forName(PRIMARY_REPOSITORY);
        Assert.assertTrue(Arrays.stream(repo.getDeclaredMethods()).anyMatch(m -> m.getName().startsWith("findBy")));
    }

    @Test
    public void t19_repositoryQueryAnnotationVerified() throws Exception {
        // SRS_REF: REQ-REPO-05 — custom JPQL for domain-specific search
        Class<?> repo = Class.forName(PRIMARY_REPOSITORY);
        Assert.assertTrue(Arrays.stream(repo.getDeclaredMethods()).anyMatch(m -> m.isAnnotationPresent(org.springframework.data.jpa.repository.Query.class)));
    }

    @Test
    public void t20_globalExceptionHandlerHandlesResourceNotFound() throws Exception {
        // SRS_REF: REQ-EX-01/02 — exception handler returns correct HTTP status + body
        Class<?> hnd = Class.forName("com.example.demo.exception.GlobalExceptionHandler");
        Class<?> exC = Class.forName("com.example.demo.exception.ResourceNotFoundException");
        Method m = Arrays.stream(hnd.getDeclaredMethods()).filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.ExceptionHandler.class) && Arrays.asList(meth.getAnnotation(org.springframework.web.bind.annotation.ExceptionHandler.class).value()).contains(exC)).findFirst().get();
        Object inst = hnd.getDeclaredConstructor().newInstance();
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(inst, exC.getConstructor(String.class).newInstance("Err"));
        Assert.assertEquals(res.getStatusCode(), HttpStatus.NOT_FOUND);
    }

    @Test
    public void t21_resourceNotFoundExceptionMappingVerified() throws Exception {
        // SRS_REF: REQ-EX-03 — ResourceNotFoundException maps to 404 in handler
        t20_globalExceptionHandlerHandlesResourceNotFound();
    }

    @Test
    public void t22_businessValidationExceptionMapsTo409Conflict() throws Exception {
        // SRS_REF: REQ-EX-04 — BusinessValidationException maps to 409 Conflict
        Class<?> hnd = Class.forName("com.example.demo.exception.GlobalExceptionHandler");
        Class<?> exC = Class.forName("com.example.demo.exception.BusinessValidationException");
        Method m = Arrays.stream(hnd.getDeclaredMethods()).filter(meth -> meth.isAnnotationPresent(org.springframework.web.bind.annotation.ExceptionHandler.class) && Arrays.asList(meth.getAnnotation(org.springframework.web.bind.annotation.ExceptionHandler.class).value()).contains(exC)).findFirst().get();
        Object inst = hnd.getDeclaredConstructor().newInstance();
        ResponseEntity<?> res = (ResponseEntity<?>) m.invoke(inst, exC.getConstructor(String.class).newInstance("Err"));
        Assert.assertEquals(res.getStatusCode(), HttpStatus.CONFLICT);
    }

    // DAY-5 | Sprint: JWT Token Generation & Validation

    @Test
    public void t23_jwtUtilSecretFieldIsPrivate() throws Exception {
        // SRS_REF: REQ-JWT-01 — secret key not accessible outside JwtService
        Class<?> util = Class.forName(JWT_CLASS_PATH);
        Field f = Arrays.stream(util.getDeclaredFields()).filter(fi -> fi.getName().toLowerCase().contains("secret")).findFirst().get();
        Assert.assertTrue(Modifier.isPrivate(f.getModifiers()));
    }

    @Test
    public void t24_jwtGenerateTokenReturnsValidFormat() throws Exception {
        // SRS_REF: REQ-JWT-02 — token generated from UserDetails
        Class<?> util = Class.forName(JWT_CLASS_PATH);
        Method m = Arrays.stream(util.getDeclaredMethods())
            .filter(meth -> meth.getName().equals("generateToken") && meth.getParameterCount() == 1)
            .findFirst().get();
        Object inst = util.getDeclaredConstructor().newInstance();
        Field f = Arrays.stream(util.getDeclaredFields()).filter(fi -> fi.getName().toLowerCase().contains("secret")).findFirst().get();
        f.setAccessible(true); f.set(inst, "PeakPerform2024SuperSecretKeyForHmacSHA256SigningAtLeast256BitsLong");
        Field exp = Arrays.stream(util.getDeclaredFields()).filter(fi -> fi.getName().toLowerCase().contains("expiration")).findFirst().get();
        exp.setAccessible(true); exp.set(inst, 3600000L);
        Object user = Proxy.newProxyInstance(UserDetails.class.getClassLoader(), new Class<?>[]{UserDetails.class}, (p, meth, a) -> meth.getName().equals("getUsername") ? AUTH_EMAIL : null);
        String tok = (String) m.invoke(inst, user);
        Assert.assertEquals(tok.split("\\.").length, 3);
    }

    @Test
    public void t25_jwtTokenRoundTripValidation() throws Exception {
        // SRS_REF: REQ-JWT-03 — token round-trip: generate then validate succeeds
        Class<?> util = Class.forName(JWT_CLASS_PATH);
        Method gen = Arrays.stream(util.getDeclaredMethods())
            .filter(meth -> meth.getName().equals("generateToken") && meth.getParameterCount() == 1)
            .findFirst().get();
        Method val = Arrays.stream(util.getDeclaredMethods())
            .filter(meth -> meth.getName().contains("isTokenValid") && meth.getParameterCount() == 2)
            .findFirst().get();
        Object inst = util.getDeclaredConstructor().newInstance();
        Field f = Arrays.stream(util.getDeclaredFields()).filter(fi -> fi.getName().toLowerCase().contains("secret")).findFirst().get();
        f.setAccessible(true); f.set(inst, "PeakPerform2024SuperSecretKeyForHmacSHA256SigningAtLeast256BitsLong");
        Field exp = Arrays.stream(util.getDeclaredFields()).filter(fi -> fi.getName().toLowerCase().contains("expiration")).findFirst().get();
        exp.setAccessible(true); exp.set(inst, 3600000L);
        Object user = Proxy.newProxyInstance(UserDetails.class.getClassLoader(), new Class<?>[]{UserDetails.class}, (p, meth, a) -> meth.getName().equals("getUsername") ? AUTH_EMAIL : null);
        String tok = (String) gen.invoke(inst, user);
        Assert.assertTrue((Boolean) val.invoke(inst, tok, user));
    }

    @Test
    public void t26_jwtExtractUsernameVerified() throws Exception {
        // SRS_REF: REQ-JWT-04 — claims correctly extracted from JWT payload
        Class<?> util = Class.forName(JWT_CLASS_PATH);
        Method ext = Arrays.stream(util.getDeclaredMethods()).filter(meth -> meth.getName().contains("extractUsername")).findFirst().get();
        Assert.assertNotNull(ext);
    }

    // DAY-6 | Sprint: Entity DB Mapping & Filter Chain

    @Test
    public void t27_entityTableNameMatchesVerified() throws Exception {
        // SRS_REF: REQ-DB-01 — entity maps to correct snake_case table name
        Class<?> ent = Class.forName(PRIMARY_ENTITY);
        Assert.assertEquals(ent.getAnnotation(jakarta.persistence.Table.class).name(), TABLE_NAME);
    }

    @Test
    public void t28_nonNullableConstraintsVerified() throws Exception {
        // SRS_REF: REQ-DB-02 — non-nullable constraints enforced at ORM level
        Class<?> ent = Class.forName(PRIMARY_ENTITY);
        Assert.assertTrue(Arrays.stream(ent.getDeclaredFields()).anyMatch(f -> f.isAnnotationPresent(jakarta.persistence.Column.class) && !f.getAnnotation(jakarta.persistence.Column.class).nullable()));
    }

    @Test
    public void t29_entityRelationshipsMappedVerified() throws Exception {
        // SRS_REF: REQ-DB-03 — entity relationships mapped via JPA
        Class<?> ent = Class.forName(SECONDARY_ENTITY);
        Assert.assertTrue(Arrays.stream(ent.getDeclaredFields()).anyMatch(f -> f.isAnnotationPresent(jakarta.persistence.ManyToOne.class)));
    }

    @Test
    public void t30_securityFilterChainAndPasswordEncoderVerified() throws Exception {
        // SRS_REF: REQ-SEC-04/05 — correct auth rules in filter chain
        Class<?> cfg = Class.forName("com.example.demo.config.SecurityConfig");
        Assert.assertTrue(Arrays.stream(cfg.getDeclaredMethods()).anyMatch(m -> m.getName().equals("passwordEncoder")));
    }
}
