from django.conf.urls import patterns, include, url
from django.contrib.auth.decorators import login_required
from helpers.urls import required

# Public urls
urlpatterns = patterns('auth.views',
        # Login example
        #
        #url(r'^login$', 'login', {
        #    'template_name': 'login.html',
        #    'authentication_form': AuthenticationForm,
        #    }, name='login'),
        #url(r'^logout$', 'logout', {
        #    'template_name': 'logout.html',
        #    }, name='logout'),
        )
# Django's standard auth urls (reset password, etc...)
urlpatterns += patterns('django.contrib.auth.views',
        # Password reset example
        #
        # Base reset form
        #url(r'^password-reset/?$', 'password_reset', {
        #    'template_name': 'password_reset/request.html',
        #    'email_template_name': 'password_reset/email.html',
        #    'subject_template_name': 'password_reset/subject.txt',
        #    'password_reset_form': PasswordResetForm,
        #    'post_reset_redirect': 'accounts:password_reset_done'
        #    }, name='password_reset'),
        # Reset done (status message)
        #url(r'^password-reset/done/?$', 'password_reset_done',
        #    { 'template_name': 'password_reset/done.html' },
        #    name='password_reset_done'),
        # Reset confirmation link and prompt form
        #url(r'^password-reset/(?P<uidb64>[0-9A-Za-z]+)-(?P<token>.+)/?$',
        #    'password_reset_confirm', {
        #        'template_name': 'password_reset/confirm.html',
        #        'set_password_form': SetPasswordForm,
        #        'post_reset_redirect': 'accounts:password_reset_complete' },
        #    name='password_reset_confirm'),
        # Reset complete (success message)
        #url(r'^password-reset/complete/?$', 'password_reset_complete',
        #    { 'template_name': 'password_reset/complete.html' },
        #    name='password_reset_complete'),
        )
# Private urls
urlpatterns += required(patterns('auth.views',
        ), login_required)
